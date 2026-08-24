"""Complaint-type playbooks: ask only what that problem needs."""

from __future__ import annotations

PLAYBOOKS: list[dict] = [
    {
        "id": "water",
        "title": "Water is not coming",
        "title_hi": "पानी नहीं आ रहा",
        "blurb": "Dry tap, dirty supply, or a broken pipeline.",
        "blurb_hi": "सूखा नल, गंदा पानी, या टूटी पाइपलाइन।",
        "keywords": ["water", "pipeline", "paani", "jal", "tap", "tanker", "borewell", "पानी", "पाइप", "नल", "टैंकर"],
        "ministry": "Ministry of Housing and Urban Affairs",
        "category": "Water supply / civic amenities",
        "needs_photo": True,
        "photo_prompt": "Take a photo of the dry tap, tanker, or the broken pipe. That is the proof.",
        "photo_prompt_hi": "सूखे नल, टैंकर या टूटी पाइप की फोटो लें। यही प्रमाण है।",
        "doc_prompt": "Optional: a water bill or a notice from the jal board. Never Aadhaar or PAN.",
        "doc_prompt_hi": "वैकल्पिक: जल बिल या जल बोर्ड का नोटिस। आधार या पैन कभी नहीं।",
        "questions": [
            {
                "id": "kind",
                "label": "What is wrong with the water?",
                "label_hi": "पानी में क्या समस्या है?",
                "type": "choice",
                "options": ["No supply", "Dirty / smelly water", "Leak or burst pipe", "Tanker did not come"],
                "options_hi": ["आपूर्ति नहीं", "गंदा / बदबूदार पानी", "रिसाव या फटी पाइप", "टैंकर नहीं आया"],
            },
            {
                "id": "days",
                "label": "How long has this been going on?",
                "label_hi": "यह कब से हो रहा है?",
                "type": "choice",
                "options": ["Today", "2–7 days", "More than a week", "More than a month"],
                "options_hi": ["आज", "2–7 दिन", "एक सप्ताह से अधिक", "एक महीने से अधिक"],
            },
            {
                "id": "spread",
                "label": "Who is affected?",
                "label_hi": "किस पर असर है?",
                "type": "choice",
                "options": ["Only my house", "This gali / street", "The whole village or ward"],
                "options_hi": ["केवल मेरा घर", "यह गली / सड़क", "पूरा गाँव या वार्ड"],
            },
            {
                "id": "source",
                "label": "Do you know the source?",
                "label_hi": "स्रोत पता है?",
                "type": "choice",
                "options": ["Municipal tap", "Handpump / borewell", "Tanker", "Unknown"],
                "options_hi": ["नगरपालिका नल", "हैंडपंप / बोरवेल", "टैंकर", "अज्ञात"],
            },
        ],
    },
    {
        "id": "road",
        "title": "Road is blocked or broken",
        "title_hi": "सड़क बंद या टूटी है",
        "blurb": "Jam, potholes, a fallen tree, or a cut that no one filled.",
        "blurb_hi": "जाम, गड्ढे, गिरा पेड़, या खोदी गई सड़क जिसे भरा नहीं गया।",
        "keywords": ["road", "sarak", "pothole", "jam", "blocked", "highway", "culvert", "gaddha", "सड़क", "सडक", "गड्ढा", "जाम"],
        "ministry": "Ministry of Road Transport and Highways",
        "category": "Road / transport",
        "needs_photo": True,
        "photo_prompt": "Photograph the blockage or the broken stretch so the desk can see it.",
        "photo_prompt_hi": "रुकावट या टूटे हिस्से की फोटो लें ताकि डेस्क देख सके।",
        "doc_prompt": "Optional: a previous complaint number. Never Aadhaar or PAN.",
        "doc_prompt_hi": "वैकल्पिक: पिछली शिकायत संख्या। आधार या पैन कभी नहीं।",
        "questions": [
            {
                "id": "kind",
                "label": "What is wrong with the road?",
                "label_hi": "सड़क में क्या समस्या है?",
                "type": "choice",
                "options": ["Blocked right now", "Deep potholes", "Broken culvert / bridge", "No work after digging"],
                "options_hi": ["अभी बंद है", "गहरे गड्ढे", "टूटा पुलिया / पुल", "खोदने के बाद काम नहीं"],
            },
            {
                "id": "days",
                "label": "Since when?",
                "label_hi": "कब से?",
                "type": "choice",
                "options": ["Today", "A few days", "Weeks", "Months"],
                "options_hi": ["आज", "कुछ दिन", "सप्ताह", "महीने"],
            },
            {
                "id": "traffic",
                "label": "What cannot pass?",
                "label_hi": "क्या नहीं निकल पा रहा?",
                "type": "choice",
                "options": ["Two-wheelers only struggling", "Cars and jeeps", "Buses and trucks", "Ambulance / school also stuck"],
                "options_hi": ["केवल दोपहिया मुश्किल से", "कार और जीप", "बस और ट्रक", "एम्बुलेंस / स्कूल भी फँसे"],
            },
        ],
    },
    {
        "id": "waste",
        "title": "Garbage, drain, or river waste",
        "title_hi": "कचरा, नाला या नदी का कचरा",
        "blurb": "Dump, nala, or waste near homes — the questions the rural field desk used.",
        "blurb_hi": "घरों के पास ढेर, नाला या कचरा।",
        "keywords": ["garbage", "kooda", "drain", "nala", "sewage", "waste", "nadi", "dump", "alag", "कचरा", "कूड़ा", "नाला", "गंदगी"],
        "ministry": "Ministry of Housing and Urban Affairs",
        "category": "Sanitation / waste",
        "needs_photo": True,
        "photo_prompt": "Photograph the dump, nala, or river edge. Stand far enough to show how close homes are.",
        "photo_prompt_hi": "ढेर, नाला या नदी किनारे की फोटो लें। घर कितने पास हैं यह दिखे।",
        "doc_prompt": "Optional: a notice from the panchayat. Never Aadhaar or PAN.",
        "doc_prompt_hi": "वैकल्पिक: पंचायत का नोटिस। आधार या पैन कभी नहीं।",
        "questions": [
            {
                "id": "type",
                "label": "What kind of waste is it?",
                "label_hi": "यह किस तरह का कचरा है?",
                "type": "choice",
                "options": ["Household dump", "Drain / sewage", "Industrial waste", "River weed or floating waste"],
                "options_hi": ["घरेलू ढेर", "नाला / सीवेज", "औद्योगिक कचरा", "नदी की घास या तैरता कचरा"],
            },
            {
                "id": "affect",
                "label": "How is it hurting people nearby?",
                "label_hi": "आसपास के लोगों को क्या नुकसान है?",
                "type": "choice",
                "options": ["Foul smell", "Mosquitoes", "Spreading illness", "Bad air", "Not affecting homes yet"],
                "options_hi": ["दुर्गंध", "मच्छर", "बीमारी फैल रही", "खराब हवा", "अभी घरों पर असर नहीं"],
            },
            {
                "id": "distance",
                "label": "How close is it to houses?",
                "label_hi": "घरों से कितनी दूरी है?",
                "type": "choice",
                "options": ["0–100 metres", "100–500 metres", "More than 500 metres"],
                "options_hi": ["0–100 मीटर", "100–500 मीटर", "500 मीटर से अधिक"],
            },
            {
                "id": "source",
                "label": "Is the source known?",
                "label_hi": "स्रोत पता है?",
                "type": "text",
                "hint": "Factory name, market, or write Unknown.",
                "hint_hi": "कारखाने का नाम, बाज़ार, या अज्ञात लिखें।",
            },
        ],
    },
    {
        "id": "cyber",
        "title": "Cyber fraud or online cheat",
        "title_hi": "साइबर धोखा या ऑनलाइन ठगी",
        "blurb": "UPI scam, fake call, hacked account — we capture the case, not your passwords.",
        "blurb_hi": "यूपीआई ठगी, फर्जी कॉल, हैक खाता — मामला दर्ज होता है, पासवर्ड नहीं।",
        "keywords": ["cyber", "upi fraud", "phishing", "hack", "scam", "otp fraud", "fake call", "online fraud", "धोखा", "फर्जी", "यूपीआई"],
        "ministry": "Ministry of Electronics and Information Technology",
        "category": "Cyber / digital fraud",
        "needs_photo": True,
        "photo_prompt": "Screenshot the fraud message or the payment screen. Hide any OTP or PIN before you upload.",
        "photo_prompt_hi": "ठगी संदेश या भुगतान स्क्रीन का स्क्रीनशॉट लें। अपलोड से पहले ओटीपी या पिन छिपाएँ।",
        "doc_prompt": "Optional: bank SMS of the debit. Never Aadhaar, PAN, OTP, or full card number.",
        "doc_prompt_hi": "वैकल्पिक: डेबिट का बैंक एसएमएस। आधार, पैन, ओटीपी या पूरा कार्ड नंबर कभी नहीं।",
        "questions": [
            {
                "id": "kind",
                "label": "What kind of cheat was this?",
                "label_hi": "यह किस तरह की ठगी थी?",
                "type": "choice",
                "options": ["UPI / payment fraud", "Fake call or WhatsApp", "Hacked social or email", "Job / KYC phishing"],
                "options_hi": ["यूपीआई / भुगतान ठगी", "फर्जी कॉल या व्हाट्सऐप", "हैक सोशल या ईमेल", "नौकरी / केवाईसी फिशिंग"],
            },
            {
                "id": "when",
                "label": "When did it happen?",
                "label_hi": "यह कब हुआ?",
                "type": "text",
                "hint": "Date and roughly the time.",
                "hint_hi": "तारीख और लगभग समय।",
            },
            {
                "id": "amount",
                "label": "Money lost, if any",
                "label_hi": "कितना पैसा गया, यदि गया हो",
                "type": "text",
                "hint": "Amount in rupees, or write None.",
                "hint_hi": "रुपये में राशि, या कुछ नहीं लिखें।",
            },
            {
                "id": "channel",
                "label": "How did they reach you?",
                "label_hi": "वे आप तक कैसे पहुँचे?",
                "type": "text",
                "hint": "App name or a phone number. Not your password.",
                "hint_hi": "ऐप का नाम या फोन नंबर। पासवर्ड नहीं।",
            },
            {
                "id": "reported",
                "label": "Have you already told the bank or cybercrime.gov.in?",
                "label_hi": "क्या बैंक या cybercrime.gov.in को बता चुके हैं?",
                "type": "choice",
                "options": ["Not yet", "Told the bank", "Filed on cybercrime.gov.in", "Both"],
                "options_hi": ["अभी नहीं", "बैंक को बताया", "cybercrime.gov.in पर दर्ज", "दोनों"],
            },
        ],
    },
    {
        "id": "power",
        "title": "Electricity is out",
        "title_hi": "बिजली गई हुई है",
        "blurb": "No bijli, dangerous wires, or a wrong bill.",
        "blurb_hi": "बिजली नहीं, खतरनाक तार, या गलत बिल।",
        "keywords": ["electric", "power", "bijli", "electricity", "outage", "transformer", "बिजली", "करंट"],
        "ministry": "Ministry of Power",
        "category": "Power supply",
        "needs_photo": True,
        "photo_prompt": "Photo of the dark street, the fallen wire, or the bill. Stay away from live wires.",
        "photo_prompt_hi": "अंधेरी सड़क, गिरे तार या बिल की फोटो। जीवित तारों से दूर रहें।",
        "doc_prompt": "Optional: the electricity bill. Never Aadhaar or PAN.",
        "doc_prompt_hi": "वैकल्पिक: बिजली बिल। आधार या पैन कभी नहीं।",
        "questions": [
            {
                "id": "kind",
                "label": "What is the power problem?",
                "label_hi": "बिजली की क्या समस्या है?",
                "type": "choice",
                "options": ["No supply", "Voltage too low / high", "Fallen or hanging wire", "Wrong bill"],
                "options_hi": ["आपूर्ति नहीं", "वोल्टेज कम / अधिक", "गिरा या लटकता तार", "गलत बिल"],
            },
            {
                "id": "days",
                "label": "Since when?",
                "label_hi": "कब से?",
                "type": "choice",
                "options": ["Hours", "1–2 days", "More than a week"],
                "options_hi": ["घंटे", "1–2 दिन", "एक सप्ताह से अधिक"],
            },
            {
                "id": "spread",
                "label": "Who is without power?",
                "label_hi": "किसके पास बिजली नहीं है?",
                "type": "choice",
                "options": ["Only my house", "This street", "The whole village"],
                "options_hi": ["केवल मेरा घर", "यह सड़क", "पूरा गाँव"],
            },
        ],
    },
    {
        "id": "general",
        "title": "Something else",
        "title_hi": "कुछ और",
        "blurb": "Pension, tax, passport, or any other department.",
        "blurb_hi": "पेंशन, कर, पासपोर्ट, या कोई अन्य विभाग।",
        "keywords": [],
        "ministry": "Department of Administrative Reforms & Public Grievances",
        "category": "General public grievance",
        "needs_photo": False,
        "photo_prompt": "A photo helps if the problem can be seen. Skip if it is only paperwork.",
        "photo_prompt_hi": "यदि समस्या दिखती है तो फोटो मदद करती है। केवल कागज़ हो तो छोड़ दें।",
        "doc_prompt": "Optional: a previous reply or a bill. Never Aadhaar, PAN, or OTP.",
        "doc_prompt_hi": "वैकल्पिक: पिछला जवाब या बिल। आधार, पैन या ओटीपी कभी नहीं।",
        "questions": [
            {
                "id": "story",
                "label": "Tell the problem in plain words",
                "label_hi": "समस्या सादे शब्दों में बताएँ",
                "type": "text",
                "hint": "What happened, when, and what you want done.",
                "hint_hi": "क्या हुआ, कब, और आप क्या चाहते हैं।",
            }
        ],
    },
]


def list_playbooks() -> list[dict]:
    return PLAYBOOKS


def get_playbook(playbook_id: str | None) -> dict:
    wanted = (playbook_id or "").strip()
    for item in PLAYBOOKS:
        if item["id"] == wanted:
            return item
    return PLAYBOOKS[-1]


def detect_playbook(text: str) -> dict:
    lowered = (text or "").lower()
    best: tuple[int, dict] | None = None
    for item in PLAYBOOKS:
        if item["id"] == "general":
            continue
        hits = sum(1 for word in item["keywords"] if word in lowered)
        if hits and (best is None or hits > best[0]):
            best = (hits, item)
    return best[1] if best else PLAYBOOKS[-1]


def assemble_description(
    playbook: dict,
    answers: dict,
    location: dict,
    helper: dict | None = None,
) -> str:
    lines = [playbook["title"] + "."]
    labels = {q["id"]: q["label"] for q in playbook.get("questions", [])}
    for key, value in (answers or {}).items():
        if not value:
            continue
        lines.append(f"{labels.get(key, key)}: {value}")
    place = ", ".join(
        part
        for part in [
            location.get("street"),
            location.get("village"),
            location.get("ward") and f"Ward {location['ward']}",
            location.get("district"),
        ]
        if part
    )
    if place:
        lines.append(f"Place: {place}.")
    if location.get("latitude") and location.get("longitude"):
        lines.append(f"Pin: {location['latitude']}, {location['longitude']}.")
    if helper and helper.get("role") == "helper":
        lines.append(
            f"Filed with help from {helper.get('helper_name') or 'a helper'}"
            f" ({helper.get('helper_relation') or 'CSC / family'}) for the citizen named above."
        )
    return "\n".join(lines)
