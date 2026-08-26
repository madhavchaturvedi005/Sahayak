"""OpenAI voice + chat for the Sahayak avatar.

Whisper transcribes speech and detects language. Chat replies in that
language. TTS speaks the reply back. If no API key is set, callers get
clear fallbacks so the UI can use the browser instead.
"""

from __future__ import annotations

import io
import logging
from typing import Any, Iterator

from app.core.config import settings
from app.services.classifier import classify_text, resolution_check
from app.services.persona import DEFAULT_INSTRUCTIONS, active_instructions
from app.services.review import context_from_text

log = logging.getLogger(__name__)

SYSTEM = DEFAULT_INSTRUCTIONS


def has_openai() -> bool:
    return bool(settings.openai_api_key)


def _client():
    from openai import OpenAI

    return OpenAI(api_key=settings.openai_api_key)


def transcribe_audio(data: bytes, filename: str = "speech.webm") -> dict[str, str]:
    if not has_openai():
        raise RuntimeError("OPENAI_API_KEY is not set")
    client = _client()
    buf = io.BytesIO(data)
    buf.name = filename
    result = client.audio.transcriptions.create(
        model="whisper-1",
        file=buf,
        response_format="verbose_json",
    )
    language = getattr(result, "language", None) or "en"
    text = getattr(result, "text", "") or ""
    return {"text": text.strip(), "language": language}


def speak_text(text: str, language: str = "en") -> bytes:
    if not has_openai():
        raise RuntimeError("OPENAI_API_KEY is not set")
    client = _client()
    voice = "nova"
    spoken = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text[:4000],
    )
    if hasattr(spoken, "read"):
        return spoken.read()
    return spoken.content


def looks_hindi(text: str, language_hint: str = "") -> bool:
    lang = (language_hint or "").lower()
    if lang.startswith("hi"):
        return True
    return any(ch in text for ch in "अआइईउऊएऐओऔकखगघचजटडणतथदधनपफबभमयरलवशषसह")


def suggest_action(text: str) -> dict[str, str]:
    lowered = text.lower()
    pairs = (
        (("status", "track", "registration", "स्थिति", "कहाँ", "ट्रैक"), "/status", "Check status"),
        (("appeal", "अपील"), "/desk/appeals", "Open appeals"),
        (("password", "पासवर्ड"), "/desk/password", "Change password"),
        (("profile", "प्रोफाइल", "प्रोफ़ाइल"), "/desk/profile", "Edit profile"),
        (("pension", "पेंशन"), "/grievance/lodge-pension", "Lodge pension grievance"),
        (("lodge", "file", "register", "complaint", "शिकायत", "दर्ज"), "/desk/lodge", "Lodge a grievance"),
        (("dashboard", "desk", "डैशबोर्ड"), "/desk", "Open dashboard"),
    )
    for words, href, label in pairs:
        if any(w in lowered for w in words):
            return {"type": "navigate", "href": href, "label": label}
    return {"type": "none"}


def _history_messages(history: list[dict[str, str]] | None) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    for item in (history or [])[-16:]:
        role = item.get("role") or "user"
        if role not in ("user", "assistant"):
            role = "user"
        content = (item.get("text") or item.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})
    return messages


def _openai_messages(
    text: str,
    history: list[dict[str, str]] | None,
    language_hint: str,
    extra_system: str = "",
) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": active_instructions()}]
    if language_hint:
        messages.append({"role": "system", "content": f"Detected spoken language: {language_hint}."})
    extra = extra_system or context_from_text(text)
    if extra:
        messages.append({"role": "system", "content": extra})
    messages.extend(_history_messages(history))
    messages.append({"role": "user", "content": text})
    return messages


def _rules_reply(text: str, language_hint: str = "") -> dict[str, Any]:
    routing = classify_text(text)
    action = suggest_action(text)
    if looks_hindi(text, language_hint):
        reply = (
            f"हाँ, मैं सुन रही हूँ। लगता है यह {routing['ministry']} के अंतर्गत "
            f"“{routing['category']}” में आ सकती है — {routing['reason']} "
            f"ऐसी शिकायतें अक्सर लगभग {routing['expected_days']} दिन लेती हैं। "
            "चाहें तो और बताएँ, या Lodge पर जाकर दर्ज करें। मैं सरकारी पोर्टल पर दाखिल नहीं करती।"
        )
        language = "hi"
    else:
        reply = (
            f"I can help with that. It may belong with {routing['ministry']} "
            f"under “{routing['category']}” — {routing['reason']} "
            f"Similar cases often take about {routing['expected_days']} days. "
            "Tell me more, or I can take you to lodge on this portal."
        )
        language = "en"
    return {
        "reply": reply,
        "language": language,
        "action": action,
        "routing": routing,
        "provider": "rules",
    }


def chat_turn(text: str, history: list[dict[str, str]] | None = None, language_hint: str = "") -> dict[str, Any]:
    routing = classify_text(text)
    action = suggest_action(text)

    if has_openai():
        try:
            client = _client()
            completion = client.chat.completions.create(
                model=settings.openai_model,
                messages=_openai_messages(text, history, language_hint),
                temperature=0.5,
            )
            reply = (completion.choices[0].message.content or "").strip()
            if reply:
                return {
                    "reply": reply,
                    "language": "hi" if looks_hindi(reply, language_hint) else (language_hint or "en"),
                    "action": action,
                    "routing": routing,
                    "provider": "openai",
                }
        except Exception as exc:
            log.warning("OpenAI chat failed: %s", exc)

    return _rules_reply(text, language_hint)


def iter_chat_events(
    text: str,
    history: list[dict[str, str]] | None = None,
    language_hint: str = "",
) -> Iterator[dict[str, Any]]:
    """Yield token events, then a final done event. Used by the live WebSocket."""
    routing = classify_text(text)
    action = suggest_action(text)

    if has_openai():
        try:
            client = _client()
            stream = client.chat.completions.create(
                model=settings.openai_model,
                messages=_openai_messages(text, history, language_hint),
                temperature=0.5,
                stream=True,
            )
            parts: list[str] = []
            for chunk in stream:
                if not chunk.choices:
                    continue
                piece = chunk.choices[0].delta.content or ""
                if piece:
                    parts.append(piece)
                    yield {"type": "token", "text": piece}
            reply = "".join(parts).strip()
            if reply:
                yield {
                    "type": "done",
                    "reply": reply,
                    "language": "hi" if looks_hindi(reply, language_hint) else (language_hint or "en"),
                    "action": action,
                    "routing": routing,
                    "provider": "openai",
                }
                return
        except Exception as exc:
            log.warning("OpenAI stream failed: %s", exc)
            yield {"type": "status", "text": "Switching to the local guide for a moment."}

    fallback = _rules_reply(text, language_hint)
    yield {"type": "token", "text": fallback["reply"]}
    yield {"type": "done", **fallback}


def check_reply(complaint: str, reply: str) -> dict[str, Any]:
    return resolution_check(complaint, reply)
