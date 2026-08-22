import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.grievance import ClassifyIn, ClassifyOut, ResolutionCheckIn
from app.services.classifier import classify_text, resolution_check
from app.services.openai_voice import (
    chat_turn,
    has_openai,
    iter_chat_events,
    speak_text,
    transcribe_audio,
)
from app.services.realtime import realtime_model, session_update
from app.services.review import context_from_text

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatIn(BaseModel):
    text: str
    language: str = ""
    history: list[ChatMessage] = []


class SpeakIn(BaseModel):
    text: str
    language: str = "en"


@router.get("/status")
def ai_status():
    return {
        "openai": has_openai(),
        "voice": has_openai(),
        "live": True,
        "realtime": has_openai(),
        "model": realtime_model() if has_openai() else "",
        "message": "OpenAI live voice is ready." if has_openai() else "Add OPENAI_API_KEY to .env and restart the backend.",
    }


@router.post("/classify", response_model=ClassifyOut)
def classify(body: ClassifyIn):
    return classify_text(body.text)


@router.post("/resolution-check")
def check_resolution(body: ResolutionCheckIn):
    return resolution_check(body.complaint, body.reply)


@router.post("/chat")
def chat(body: ChatIn):
    return chat_turn(body.text, history=[m.model_dump() for m in body.history], language_hint=body.language)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not has_openai():
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not set. Add it to .env and restart.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio")
    try:
        return transcribe_audio(data, filename=file.filename or "speech.webm")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not transcribe audio: {exc}") from exc


@router.post("/speak")
def speak(body: SpeakIn):
    if not has_openai():
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not set. Add it to .env and restart.")
    try:
        audio = speak_text(body.text, body.language)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not speak: {exc}") from exc
    return Response(content=audio, media_type="audio/mpeg")


def _safe_history(raw: Any) -> list[dict[str, str]]:
    history: list[dict[str, str]] = []
    if not isinstance(raw, list):
        return history
    for item in raw[-16:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "user")
        if role not in ("user", "assistant"):
            role = "user"
        text = str(item.get("text") or item.get("content") or "").strip()
        if text:
            history.append({"role": role, "text": text})
    return history


@router.websocket("/ws")
async def assistant_socket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json(
        {
            "type": "ready",
            "openai": has_openai(),
            "voice": has_openai(),
            "message": "Connected. Ask me anything about lodging, tracking, or your grievance.",
        }
    )
    try:
        while True:
            incoming = await websocket.receive_text()
            try:
                data = json.loads(incoming)
            except json.JSONDecodeError:
                data = {"type": "message", "text": incoming}

            kind = str(data.get("type") or "message")
            if kind == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            text = str(data.get("text") or "").strip()
            if not text:
                await websocket.send_json({"type": "error", "message": "Please type or say something first."})
                continue

            language = str(data.get("language") or "")
            history = _safe_history(data.get("history"))
            await websocket.send_json({"type": "status", "state": "thinking"})

            loop = asyncio.get_running_loop()
            queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

            def produce() -> None:
                try:
                    for event in iter_chat_events(text, history=history, language_hint=language):
                        loop.call_soon_threadsafe(queue.put_nowait, event)
                except Exception as exc:
                    log.exception("Live chat failed")
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        {"type": "error", "message": f"I could not answer just now: {exc}"},
                    )
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, None)

            producer = asyncio.create_task(asyncio.to_thread(produce))
            while True:
                event = await queue.get()
                if event is None:
                    break
                await websocket.send_json(event)
            await producer
    except WebSocketDisconnect:
        return
    except Exception as exc:
        log.exception("Assistant socket closed")
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
            await websocket.close()
        except Exception:
            return


async def _openai_realtime():
    import websockets

    if not has_openai():
        raise RuntimeError("OPENAI_API_KEY is not set")
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
    }
    models = [realtime_model(), "gpt-realtime", "gpt-realtime-mini"]
    last_error: Exception | None = None
    for model in dict.fromkeys(models):
        url = f"wss://api.openai.com/v1/realtime?model={model}"
        try:
            try:
                return await websockets.connect(
                    url,
                    additional_headers=headers,
                    max_size=None,
                    ping_interval=20,
                    open_timeout=12,
                    close_timeout=3,
                )
            except TypeError:
                return await websockets.connect(
                    url,
                    extra_headers=headers,
                    max_size=None,
                    ping_interval=20,
                    open_timeout=12,
                    close_timeout=3,
                )
        except Exception as exc:
            last_error = exc
            log.warning("Realtime model %s failed: %s", model, exc)
    raise last_error or RuntimeError("Could not open OpenAI Realtime")


@router.websocket("/realtime")
async def openai_realtime_socket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json(
        {"type": "status", "state": "connecting", "message": "Connecting to OpenAI live voice…"}
    )
    if not has_openai():
        await websocket.send_json({"type": "error", "message": "OPENAI_API_KEY is not set."})
        await websocket.close()
        return

    try:
        remote = await asyncio.wait_for(_openai_realtime(), timeout=20)
    except Exception as exc:
        log.exception("Could not open OpenAI Realtime")
        await websocket.send_json(
            {"type": "error", "message": f"Could not start OpenAI live voice: {exc}"}
        )
        await websocket.close()
        return

    registration_id = websocket.query_params.get("registration_id") or ""
    extra = context_from_text(registration_id) if registration_id else ""
    signed_in = websocket.query_params.get("signed_in") == "1"
    path = websocket.query_params.get("path") or ""
    await remote.send(json.dumps(session_update(extra, signed_in=signed_in, path=path)))
    await websocket.send_json(
        {
            "type": "ready",
            "openai": True,
            "voice": True,
            "realtime": True,
            "message": "OpenAI live voice is connected.",
        }
    )

    async def client_to_openai() -> None:
        try:
            while True:
                incoming = await websocket.receive_text()
                await remote.send(incoming)
        except WebSocketDisconnect:
            return
        except Exception:
            return

    async def openai_to_client() -> None:
        try:
            async for message in remote:
                text = message if isinstance(message, str) else message.decode()
                await websocket.send_text(text)
        except Exception:
            return

    try:
        await asyncio.gather(client_to_openai(), openai_to_client())
    finally:
        try:
            await remote.close()
        except Exception:
            return
