"""OpenAI Realtime WebSocket — GA session shape (beta header retired)."""

from __future__ import annotations

from app.core.config import settings

REALTIME_INSTRUCTIONS = """You are Sahayak, a calm citizen companion inside this Sahayak demo of CPGRAMS.
You never claim to be an official government officer. You never file on the live
government portal and you do not send people to pgportal.gov.in until they have a
finished summary to copy. Guide them inside this app.

Your job, in this order:
1. If they are not signed in and they want to lodge, track, or use the desk — help them sign in.
2. Hear the problem in their own words. Ask at most one clarifying question if you truly need it.
3. Call route_complaint so the lodge form opens on the right ministry. Say why, and the typical wait.

Sign-in (mocked — no real SMS):
- Demo mobile 9876543210, password sahayak, OTP 123456.
- If they say demo, sample, dummy, or "log me in": call login with action=demo_otp.
- Otherwise walk them: login open → set_mobile → request_otp → set_otp → verify_otp.
- Always say the OTP is a demo code and no SMS is sent.
- After sign-in, continue to the complaint. Do not stop at the dashboard unless they ask.

Lodging:
- Call route_complaint with their description. That opens the lodge form with ministry filled.
- Tell them the ministry, the reason, and typical days. They still confirm the form themselves.
- You can override if they name a different department.

Tracking a closed file: generic replies (visit the office, matter examined, already disposed)
are usually not a real resolution. Send them to the status page and Draft appeal.
Appeal window is 30 days after closure.

Speak in the citizen's language. Hindi or Hinglish → simple Hindi. English → plain English.
Keep spoken answers to 2–5 sentences. Do not read URLs. Say the page name.
Call a tool instead of only describing a button when they want to move.
"""

TOOLS = [
    {
        "type": "function",
        "name": "navigate",
        "description": "Open a page inside Sahayak.",
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
        "description": "Drive the mocked Sahayak sign-in form. Use demo_otp when they want the sample account.",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": [
                        "open",
                        "set_mobile",
                        "set_password",
                        "set_otp",
                        "request_otp",
                        "verify_otp",
                        "password_signin",
                        "demo_otp",
                    ],
                },
                "value": {
                    "type": "string",
                    "description": "Mobile, password, or OTP when the action needs one.",
                },
                "next": {
                    "type": "string",
                    "description": "Where to go after a successful sign-in, default /desk/lodge",
                },
            },
            "required": ["action"],
        },
    },
    {
        "type": "function",
        "name": "route_complaint",
        "description": "Find the right ministry for a spoken complaint and open the lodge form there.",
        "parameters": {
            "type": "object",
            "properties": {
                "problem": {
                    "type": "string",
                    "description": "The citizen's problem in their own words.",
                }
            },
            "required": ["problem"],
        },
    },
]


def realtime_model() -> str:
    return settings.openai_realtime_model or "gpt-realtime"


def session_update(
    extra_instructions: str = "",
    signed_in: bool = False,
    path: str = "",
) -> dict:
    context = (
        f"Citizen signed in: {'yes' if signed_in else 'no'}. "
        f"Current page: {path or 'unknown'}."
    )
    if extra_instructions:
        context = f"{context}\n{extra_instructions}"
    return {
        "type": "session.update",
        "session": {
            "type": "realtime",
            "instructions": f"{REALTIME_INSTRUCTIONS}\n\n{context}",
            "tool_choice": "auto",
            "tools": TOOLS,
            "output_modalities": ["audio"],
            "audio": {
                "input": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "transcription": {"model": "gpt-4o-mini-transcribe"},
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 650,
                        "create_response": True,
                    },
                },
                "output": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "voice": "marin",
                },
            },
        },
    }
