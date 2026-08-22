"""Explainable category/department matcher.

Keyword rules first. An optional model call is only a fallback and still
returns a one-sentence reason a citizen can read.
"""

from __future__ import annotations

import json

RULES: list[dict] = [
    {
        "keywords": ["water", "pipeline", "paani", "supply", "sewer", "drain", "jal"],
        "ministry": "Ministry of Housing and Urban Affairs",
        "category": "Water supply / civic amenities",
        "reason": "Complaints about water, pipelines, or civic amenities are usually filed with Housing and Urban Affairs.",
        "expected_days": 28,
        "pendency_pct": 22,
    },
    {
        "keywords": ["passport", "visa", "oci"],
        "ministry": "Ministry of External Affairs",
        "category": "Passport / consular services",
        "reason": "Passport and consular issues map to the Ministry of External Affairs.",
        "expected_days": 21,
        "pendency_pct": 14,
    },
    {
        "keywords": ["income tax", "refund", "pan", "itr", "gst", "tax"],
        "ministry": "Department of Revenue",
        "category": "Income tax / GST",
        "reason": "Tax refund and assessment complaints are typically handled by the Department of Revenue.",
        "expected_days": 45,
        "pendency_pct": 31,
    },
    {
        "keywords": ["pension", "ppo", "epfo", "epf", "retirement"],
        "ministry": "Department of Pension & Pensioners' Welfare",
        "category": "Pension / retirement benefits",
        "reason": "Pension and PPO issues are routed to the Department of Pension & Pensioners' Welfare.",
        "expected_days": 35,
        "pendency_pct": 19,
    },
    {
        "keywords": ["railway", "train", "ticket", "irctc", "rail"],
        "ministry": "Ministry of Railways",
        "category": "Rail services",
        "reason": "Train, ticket, and station complaints are usually filed with the Ministry of Railways.",
        "expected_days": 18,
        "pendency_pct": 11,
    },
    {
        "keywords": ["aadhaar", "uidai", "enrol"],
        "ministry": "Unique Identification Authority of India",
        "category": "Aadhaar services",
        "reason": "Aadhaar enrolment and update issues map to UIDAI.",
        "expected_days": 24,
        "pendency_pct": 16,
    },
    {
        "keywords": ["bank", "loan", "account", "atm", "upi", "insurance"],
        "ministry": "Department of Financial Services",
        "category": "Banking / insurance",
        "reason": "Banking and insurance grievances are typically filed with the Department of Financial Services.",
        "expected_days": 30,
        "pendency_pct": 20,
    },
    {
        "keywords": ["electric", "power", "bijli", "electricity", "outage"],
        "ministry": "Ministry of Power",
        "category": "Power supply",
        "reason": "Electricity and outage complaints are usually filed with the Ministry of Power or the linked DISCOM.",
        "expected_days": 20,
        "pendency_pct": 17,
    },
    {
        "keywords": ["hospital", "health", "ayushman", "medical", "doctor"],
        "ministry": "Ministry of Health & Family Welfare",
        "category": "Public health services",
        "reason": "Hospital and health-scheme issues map to the Ministry of Health & Family Welfare.",
        "expected_days": 32,
        "pendency_pct": 23,
    },
    {
        "keywords": ["phone", "mobile", "broadband", "sim", "telecom", "jio", "airtel", "bsnl"],
        "ministry": "Department of Telecommunications",
        "category": "Telecom services",
        "reason": "SIM, broadband, and telecom complaints are typically filed with the Department of Telecommunications.",
        "expected_days": 22,
        "pendency_pct": 15,
    },
    {
        "keywords": ["labour", "employment", "wages", "esi", "nrega", "mgnrega"],
        "ministry": "Ministry of Labour and Employment",
        "category": "Labour / employment",
        "reason": "Wage, ESI, and employment complaints are usually filed with Labour and Employment.",
        "expected_days": 30,
        "pendency_pct": 21,
    },
    {
        "keywords": ["post office", "speed post", "parcel", "india post", "postage"],
        "ministry": "Department of Posts",
        "category": "Postal services",
        "reason": "Speed post and post-office complaints map to the Department of Posts.",
        "expected_days": 20,
        "pendency_pct": 16,
    },
    {
        "keywords": ["police", "fir", "home affairs", "citizenship", "nrc"],
        "ministry": "Ministry of Home Affairs",
        "category": "Home affairs",
        "reason": "Police-verification and home-affairs issues are typically filed with the Ministry of Home Affairs.",
        "expected_days": 32,
        "pendency_pct": 24,
    },
    {
        "keywords": ["kisan", "pm-kisan", "farmer", "instalment", "fasal"],
        "ministry": "Department of Agriculture & Farmers Welfare",
        "category": "Farmers welfare / PM-KISAN",
        "reason": "Stopped PM-KISAN instalments and farmer-scheme issues map to Agriculture and Farmers Welfare.",
        "expected_days": 35,
        "pendency_pct": 26,
    },
]

DEFAULT = {
    "ministry": "Department of Administrative Reforms & Public Grievances",
    "category": "General public grievance",
    "reason": "No strong keyword match — DARPG is the default nodal department so a human can re-route if needed.",
    "expected_days": 30,
    "pendency_pct": 18,
}


def classify_text(text: str) -> dict:
    lowered = (text or "").lower()
    scores: list[tuple[int, dict]] = []
    for rule in RULES:
        hits = sum(1 for word in rule["keywords"] if word in lowered)
        if hits:
            scores.append((hits, rule))
    if not scores:
        return DEFAULT.copy()
    scores.sort(key=lambda item: item[0], reverse=True)
    chosen = scores[0][1]
    return {
        "ministry": chosen["ministry"],
        "category": chosen["category"],
        "reason": chosen["reason"],
        "expected_days": chosen["expected_days"],
        "pendency_pct": chosen["pendency_pct"],
    }


GENERIC_PHRASES = (
    "as per rules",
    "as per norms",
    "no action",
    "already disposed",
    "disposed of",
    "file is closed",
    "matter examined",
    "matter has been examined",
    "visit office",
    "visit the office",
    "visit the concerned",
    "kindly visit",
    "forwarded",
    "in the normal course",
    "processed in the normal course",
    "please resubmit",
    "no further action",
    "closed without",
    "no speaking order",
)

PRIORITY = {
    "speaking", "order", "refund", "instalment", "installment", "credited",
    "passport", "pension", "permit", "clearance", "delay", "pending",
}

STOP = {
    "the", "and", "for", "that", "this", "with", "from", "have", "been",
    "will", "your", "you", "are", "was", "were", "not", "but", "our",
    "please", "kindly", "regarding", "matter", "issue", "has", "had",
    "already", "without", "their", "there", "which", "about",
}


def _tokens(complaint: str) -> list[str]:
    nouns = [
        w.strip(".,!?;:'\"()").lower()
        for w in (complaint or "").split()
        if len(w) > 4 and w.lower() not in STOP
    ]
    return list(dict.fromkeys(nouns))


def _keyword_check(complaint: str, reply: str) -> dict:
    """Explainable miss-list. Generic brush-offs are never treated as resolved."""
    found = [w for w in _tokens(complaint) if w not in (reply or "").lower()]
    missing = [
        word
        for _, word in sorted(
            enumerate(found),
            key=lambda item: (0 if item[1] in PRIORITY else 1, item[0]),
        )[:6]
    ]
    generic = any(phrase in (reply or "").lower() for phrase in GENERIC_PHRASES)
    addressed = len(missing) <= 2 and not generic
    points = ", ".join(missing[:4]) if missing else "the original request"
    draft = ""
    if not addressed:
        draft = (
            f"I filed a grievance about: {(complaint or '').strip()[:280]}\n\n"
            f"The reply I received does not address: {points}. "
            "Please reopen this grievance and respond to the specific points above, "
            "instead of a generic closure."
        )
    reason = (
        "The reply covers the main points of the complaint."
        if addressed
        else (
            "This looks like a generic closure — it does not decide the original request."
            if generic
            else f"The reply never mentions: {', '.join(missing) or 'the core request'}."
        )
    )
    missing_sentences: list[str] = []
    leftover = list(missing)
    if "speaking" in leftover and "order" in leftover:
        missing_sentences.append("The reply still gave no speaking order.")
        leftover = [w for w in leftover if w not in ("speaking", "order")]
    missing_sentences.extend(f"The reply never mentions “{w}”." for w in leftover[: 4 - len(missing_sentences)])
    if not addressed and not missing_sentences:
        missing_sentences = ["The reply did not decide the original request."]

    return {
        "addressed": addressed,
        "missing": missing_sentences,
        "missing_tokens": missing,
        "reason": reason,
        "appeal_draft": draft,
        "generic": generic,
    }


def _enrich_with_openai(complaint: str, reply: str, base: dict) -> dict:
    """Phrase missing asks as sentences. Keep the keyword reason visible."""
    from app.core.config import settings

    if not settings.openai_api_key:
        return base
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key, timeout=8.0)
        completion = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You help Indian citizens read a CPGRAMS department reply. "
                        "Return JSON only with keys missing (array of short sentences, max 4), "
                        "reason (one plain sentence), appeal_draft (short factual appeal or empty). "
                        "If the reply is generic — visit office, matter examined, forwarded, "
                        "already disposed, resubmit, normal course — it did not resolve the complaint. "
                        "Never claim to be a government officer. Never say you will file the appeal."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Complaint:\n{complaint}\n\nReply:\n{reply}\n\n"
                        f"Explainable check: generic={base['generic']}, "
                        f"missing_tokens={base['missing_tokens']}, "
                        f"keyword_reason={base['reason']}"
                    ),
                },
            ],
        )
        raw = (completion.choices[0].message.content or "").strip()
        if not raw:
            return base
        parsed = json.loads(raw)
        missing = [str(item).strip() for item in (parsed.get("missing") or []) if str(item).strip()][:4]
        reason = str(parsed.get("reason") or "").strip() or base["reason"]
        draft = str(parsed.get("appeal_draft") or "").strip()
        if base["addressed"]:
            draft = ""
        elif not draft:
            draft = base["appeal_draft"]
        return {
            **base,
            "missing": missing or base["missing"],
            "reason": reason,
            "appeal_draft": draft,
        }
    except Exception:
        return base


def resolution_check(complaint: str, reply: str, enrich: bool = True) -> dict:
    """Flag replies that never mention the citizen's key asks."""
    base = _keyword_check(complaint, reply)
    if not enrich:
        return base
    return _enrich_with_openai(complaint, reply, base)
