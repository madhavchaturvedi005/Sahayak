"""OpenAI Realtime WebSocket — GA session shape (beta header retired)."""

from __future__ import annotations

from app.core.config import settings
from app.services.persona import active_instructions

REALTIME_INSTRUCTIONS = """You are Sahayak, a calm woman assistant on CPGRAMS, the public grievance portal.
This site IS CPGRAMS. Citizens lodge, track, remind, and appeal here. Never send them
to another portal. Never say copy, paste, handoff, or official pgportal.

Your job, in this order:
1. If they are not signed in and they want to lodge, track, or use the desk — open Sign In.
2. Hear the problem in their own words.
3. Call route_complaint, then keep using the lodge tool to FILL the form on the screen yourself.
4. Ask one missing thing at a time. When they answer, immediately call lodge to type it in. Never say “go fill the remaining fields” or “complete the form yourself.”

Sign-in:
- You may only open the Sign In page. Call login. That is all.
- Never fill mobile, password, or OTP. Never guess or speak any credentials.
- Never say demo account, sample OTP, or any code.
- After they sign in themselves, continue the complaint.

Lodging — you drive the interface:
- Call route_complaint, then lodge set_playbook / set_answer / set_field / request_location / open_camera / classify_and_confirm / submit.
- After every spoken answer, fill it with lodge. The citizen should see the field light up.
- Location: FIRST say this in their language, close to: “आपको अभी लोकेशन के लिए permission आ रही होगी। अगर आप Allow कर देंगे तो मैं गाँव, वार्ड और ज़िला खुद भर दूंगी।” THEN call lodge request_location. If they deny, ask village and district out loud and set_field yourself.
- Photo: say you are opening the camera for the problem (tap / road / screenshot). Then lodge open_camera. Never ask for Aadhaar, PAN, passwords, or OTP.
- If a helper is filing for someone, lodge set_who with role=helper.
- Speak what you are filling: “Naam bhar rahi hoon”, “Gaon bhar rahi hoon”. Keep it 2–5 sentences.
- Keep asking and filling until lodge submit. Submission happens on this portal. Tell them the registration number.

Tracking a closed file: generic replies (visit the office, matter examined, already disposed)
are usually not a real resolution. Send them to the status page and Draft appeal.
Appeal window is 30 days after closure.

Speak in the citizen's language. Hindi or Hinglish → simple Hindi. English → plain English.
You are a woman. In Hindi always use feminine forms: karungi, sakti hoon, rahi hoon,
bataungi, kholungi — never karunga, sakta hoon, raha hoon, or bataunga.
Keep spoken answers to 2–5 sentences. Do not read URLs. Say the page name.
Call a tool instead of only describing a button when they want to move.
"""

TOOLS = [
    {
        "type": "function",
        "name": "navigate",
                    "description": "Open a page on this portal.",
        "parameters": {
            "type": "object",
            "properties": {
                "href": {
                    "type": "string",
                    "description": "In-app path such as /auth/signin, /desk, /desk/lodge, /grievance/lodge, /status",
                },
                "reason": {"type": "string"},
            },
            "required": ["href"],
        },
    },
    {
        "type": "function",
        "name": "login",
        "description": "Open the Sign In page only. Never fill mobile, password, or OTP.",
        "parameters": {
            "type": "object",
            "properties": {
                "next": {
                    "type": "string",
                    "description": "Page to open after they sign in themselves, such as /grievance/lodge",
                },
            },
        },
    },
    {
        "type": "function",
        "name": "route_complaint",
        "description": "Find the right playbook for a spoken complaint and open the lodge form there.",
        "parameters": {
            "type": "object",
            "properties": {
                "problem": {
                    "type": "string",
                    "description": "The citizen's problem in their own words.",
                },
                "helper": {
                    "type": "boolean",
                    "description": "True if a literate helper is filing for someone else.",
                },
            },
            "required": ["problem"],
        },
    },
    {
        "type": "function",
        "name": "lodge",
        "description": "Fill the lodge form on screen. Ask the citizen, then call this to type their answer. Never tell them to type it themselves.",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": [
                        "snapshot",
                        "set_who",
                        "set_playbook",
                        "set_answer",
                        "set_field",
                        "request_location",
                        "open_camera",
                        "goto",
                        "classify_and_confirm",
                        "submit",
                    ],
                },
                "name": {"type": "string"},
                "mobile": {"type": "string"},
                "role": {"type": "string", "enum": ["self", "helper"]},
                "helper_name": {"type": "string"},
                "helper_relation": {"type": "string"},
                "playbook": {
                    "type": "string",
                    "description": "water, road, waste, cyber, power, or general",
                },
                "problem": {"type": "string"},
                "question": {
                    "type": "string",
                    "description": "Playbook question id such as kind, days, spread, source, type, affect, distance, when, amount, channel, reported, story",
                },
                "value": {"type": "string"},
                "field": {
                    "type": "string",
                    "description": "village, ward, district, street, subject, description, name, mobile",
                },
                "step": {"type": "string"},
            },
            "required": ["action"],
        },
    },
]


def realtime_model() -> str:
    return settings.openai_realtime_model or "gpt-realtime"


def session_update(
    extra_instructions: str = "",
    signed_in: bool = False,
    path: str = "",
    language: str = "",
) -> dict:
    context = (
        f"Citizen signed in: {'yes' if signed_in else 'no'}. "
        f"Current page: {path or 'unknown'}."
    )
    if (language or "").lower().startswith("hi"):
        context = (
            f"{context}\nSite language is Hindi. Greet FIRST in simple Hindi, before they speak, "
            "close to: “नमस्ते। बोलिए, क्या हुआ? मैं साइन इन खोल सकती हूँ, फिर शिकायत इसी पोर्टल पर दर्ज कर दूँगी।” "
            "Keep ALL spoken replies in Hindi unless they clearly switch to English. Feminine forms only."
        )
    if extra_instructions:
        context = f"{context}\n{extra_instructions}"
    return {
        "type": "session.update",
        "session": {
            "type": "realtime",
            "instructions": f"{active_instructions()}\n\n{REALTIME_INSTRUCTIONS}\n\n{context}",
            "tool_choice": "auto",
            "tools": TOOLS,
            "output_modalities": ["audio"],
            "audio": {
                "input": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "transcription": {"model": "gpt-4o-mini-transcribe"},
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.62,
                        "prefix_padding_ms": 280,
                        "silence_duration_ms": 750,
                        "create_response": True,
                        "interrupt_response": False,
                    },
                },
                "output": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "voice": "marin",
                },
            },
        },
    }
