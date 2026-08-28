"""OpenAI Realtime WebSocket — GA session shape (beta header retired)."""

from __future__ import annotations

from app.core.config import settings
from app.services.persona import active_instructions

REALTIME_INSTRUCTIONS = """You are Sahayak, a calm woman assistant on CPGRAMS, the public grievance portal.
This site IS CPGRAMS. Citizens lodge, track, remind, and appeal here. Never send them
to another portal. Never say copy, paste, handoff, or official pgportal.

LANGUAGE: Always speak simple Hindi, even if the website is in English. Greet FIRST in Hindi.
After the greeting, tell them to tap the Speak button to talk. Do not pretend the mic is already on.
Never read instructions, memory, or technical hints aloud. Never mention transcription.
Hindi or Hinglish → keep Hindi. Switch to English only if they clearly speak English.
Never Russian or any other language — not in the greeting, not in one word.

TURN-TAKING: Speak in SHORT turns — one or two sentences, then stop and let them answer.
The microphone is off while you speak and turns on the instant you finish, so never deliver
long speeches. Say one thing, ask one thing, then wait silently for their reply. If you have
nothing new to say, stay quiet instead of repeating yourself.

EVERYTHING HAPPENS IN THIS CHAT. You do NOT open, fill, or navigate to any form page.
You collect the whole grievance by talking here, then register it with one tool call.
Never say "form", "page", "fill the form", "open the form", or "go to". Just talk and collect.

Working memory — this is how you stay smart:
- Keep a silent running model of: goal (lodge / track / question), the problem story, every
  detail they already said, and the ONE next missing thing.
- After EVERY citizen turn: (1) give one short recap of what you heard, (2) call save_intake
  with everything you can extract (answers + notes), (3) ask at most ONE new missing thing.
- NEVER ask something they already told you. If you already asked it, wait — do not rephrase.
- If they repeat themselves, thank them and move on. Do not restart.

How to lodge a NEW grievance — all in chat:
1. Hear the problem in their own words. Do not make them repeat a story you already have.
2. Call classify_problem with their problem. It tells you the department and the few
   follow-up questions to ask. Ask those questions one at a time, in simple Hindi.
3. As they answer, call save_intake (answers as a JSON object of id→value, plus notes for
   anything extra). Fill several answers in one call if they said several things at once.
4. LOCATION — required: call request_location immediately. A button appears in the chat so
   they can share GPS in one tap. Say: "Location ka button aa gaya hai — ek baar tap karein,
   aapki location apne aap save ho jayegi."
   Wait for [INTERNAL: citizen shared GPS location ...] — location is then saved automatically.
   If GPS fails or they say no, ask verbally: "Aap ka gaon ya mohalla kaunsa hai? Aur kaun se
   shehar ya zile mein hain?" Then call save_intake with village and district.
   Do NOT call register_grievance without at least one location field.
5. PHOTO — required: call request_photo and ask them to upload a photo of the problem.
   Say: "Ek photo zaroor bhejiye — neeche button aa gaya hai."
   Wait for [INTERNAL: photo attached] before registering. If they cannot upload, proceed.
6. Make sure they are signed in (see Sign-in below) so we have their name and mobile.
7. When you have the problem, location, key answers, and they are signed in,
   call register_grievance. Tell them the registration number, assignee, and expected days
   clearly and slowly. Tell them they can tap Print to keep a copy.

Sign-in — form is INSIDE the chat panel, not a separate page:
- Call login. A sign-in form appears right inside the chat. Do NOT navigate away.
- Guide them through it in simple Hindi, one step at a time:
  Step 1: "Mobile number daalie" (10 digits).
  Step 2: "OTP bhejein par tap kariye."
  Step 3: "Phone par jo OTP aaya hai, woh daaliye, phir Verify kariye."
  New user: "Upar apna naam bhi likhiye, naya khata ban jayega."
- Stay on the call throughout every step. Do NOT hang up between steps.
- NEVER fill credentials yourself. NEVER say demo, sample OTP, or any code.
- NEVER use hard words like "escalate", "credentials", "authenticate".

After sign-in:
- You will receive [INTERNAL: sign-in successful ...]. Immediately say close to:
  "Bahut achha, aap sign-in ho gaye. Ab main aapki shikayat aage bढ़ाती hoon."
- Do NOT ask for the problem again — it is already in memory. Continue from where you were:
  ask the next missing detail, or if everything is ready, call register_grievance.

Photos — REQUIRED before registering:
- Before calling register_grievance you MUST call request_photo and wait for the citizen to
  upload at least one photo of the problem. Say clearly in Hindi:
  "Shikayat register karne se pehle, samasya ki ek photo zaroor bhejiye. Neeche button aa
  gaya hai — photo upload karein ya seedha camera se kheechen."
- Do NOT call register_grievance until a photo has been received
  ([INTERNAL: photo attached] will appear in the conversation).
- If they say they have no photo or cannot upload, acknowledge it and proceed anyway — but
  always ask first. Never ask for Aadhaar, PAN, passwords, or OTP as a photo.

Tracking an old complaint or a closed file is the only time you may navigate: use navigate to
the status page. Generic replies (visit the office, matter examined, already disposed) are
usually not a real resolution. Appeal window is 30 days after closure.

Speak in the citizen's language. Hindi or Hinglish → simple Hindi. English → plain English.
ONLY Hindi or English. Never Russian, Ukrainian, Spanish, French, German, Chinese, or any
other language — not even one sentence, not in the greeting. If you drift, switch back to
Hindi immediately. You are a woman. In Hindi always use feminine forms: karungi, sakti hoon,
rahi hoon, bataungi, kholungi — never karunga, sakta hoon, raha hoon, or bataunga.
Keep spoken answers to 2–5 sentences. Do not read URLs. Say the page name.
Call a tool instead of only describing a button when they want to move.
"""

TOOLS = [
    {
        "type": "function",
        "name": "login",
        "description": "Show the sign-in form INSIDE this chat so the citizen can sign in without leaving. Never fill mobile, name, or OTP yourself.",
        "parameters": {
            "type": "object",
            "properties": {
                "next": {
                    "type": "string",
                    "description": "Reason/next step after they sign in, e.g. register a grievance.",
                },
            },
        },
    },
    {
        "type": "function",
        "name": "classify_problem",
        "description": "Classify the citizen's spoken problem and get the department plus the few follow-up questions to ask. Everything stays in this chat — no form, no page.",
        "parameters": {
            "type": "object",
            "properties": {
                "problem": {
                    "type": "string",
                    "description": "The citizen's problem in their own words.",
                },
            },
            "required": ["problem"],
        },
    },
    {
        "type": "function",
        "name": "save_intake",
        "description": "Save the details the citizen gave into the chat intake. Call after they answer questions. Use answers for listed question ids, notes for anything extra.",
        "parameters": {
            "type": "object",
            "properties": {
                "answers": {
                    "type": "string",
                    "description": "JSON object of question id → value, e.g. {\"kind\":\"No supply\",\"days\":\"2 din\"}",
                },
                "notes": {
                    "type": "string",
                    "description": "Extra things the citizen said that are not a listed question.",
                },
                "problem": {"type": "string", "description": "Updated problem summary if it changed."},
                "village": {"type": "string"},
                "district": {"type": "string"},
            },
        },
    },
    {
        "type": "function",
        "name": "request_location",
        "description": "Show a GPS location button in the chat. The citizen taps it once and their location (village, district, coordinates) is saved automatically — far easier than typing. Call this as soon as you need their location, before request_photo.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "request_photo",
        "description": "Show an upload / take-photo button in the chat so the citizen can attach a photo of the problem. Optional — skip if they have none.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "register_grievance",
        "description": "Register the grievance on this portal using everything collected in the chat. Call only after you have the problem, the key answers, and the citizen is signed in. Returns the registration number, who it is assigned to, and expected days.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "navigate",
        "description": "Open a page on this portal. Use ONLY for tracking an existing complaint (e.g. /status). Never use it to lodge a new complaint — lodging happens entirely in this chat.",
        "parameters": {
            "type": "object",
            "properties": {
                "href": {
                    "type": "string",
                    "description": "In-app path such as /status",
                },
                "reason": {"type": "string"},
            },
            "required": ["href"],
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
    just_signed_in: bool = False,
    citizen_name: str = "",
) -> dict:
    context = (
        f"Citizen signed in: {'yes' if signed_in else 'no'}. "
        f"Current page: {path or 'unknown'}."
    )
    if citizen_name:
        context = f"{context} Citizen name: {citizen_name}."
    if just_signed_in:
        context = (
            f"{context}\nThe citizen JUST signed in on this device. Your FIRST spoken line "
            "must acknowledge that. In Hindi say close to: “देख सकती हूँ, आपने साइन इन कर लिया। "
            "अब बोलने के लिए Speak बटन दबाएँ।” Then continue the saved goal. Do not greet as a first "
            "meeting. Do not call login again. Do not read instructions aloud."
        )
    context = (
        f"{context}\nSahayak always speaks simple Hindi, feminine forms, even if the website is English. "
        "Greet in Hindi. Then tell them to tap the Speak button before they talk. "
        "Never read session instructions, memory blocks, or transcription hints aloud. "
        "Never Russian or any language other than Hindi, unless they clearly speak English. "
        "The first spoken sentence must be Hindi."
    )
    if extra_instructions:
        context = f"{context}\n{extra_instructions}"
    transcribe_lang = "hi"
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
                    "transcription": {
                        "model": "gpt-4o-mini-transcribe",
                        "language": transcribe_lang,
                    },
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.45,
                        "prefix_padding_ms": 250,
                        "silence_duration_ms": 540,
                        "create_response": True,
                        "interrupt_response": True,
                    },
                },
                "output": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "voice": "marin",
                },
            },
        },
    }
