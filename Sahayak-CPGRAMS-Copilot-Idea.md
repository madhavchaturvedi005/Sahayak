# Sahayak — An AI Copilot for Filing & Following Up on Government Grievances (CPGRAMS)

**Build for:** Build What Moves India (buildwhatmovesindia.com)
**Built with:** Codex / OpenAI models
**Status:** Refined concept, ready for build — 5-day sprint

---

## 1. One-line pitch

A voice-and-text AI avatar that verifies a citizen with their mobile number, understands their problem in plain language, tells them honestly which department to file with and how long it'll realistically take (using real government disposal-time data), helps them assemble a clean, correctly-categorized grievance — and later checks whether the reply they got back was a real resolution or a brush-off, drafting a sharp appeal if it wasn't.

It does **not** file anything on the live government portal. It gets the citizen to the door, fully prepared, in seconds instead of confusion.

---

## 2. The real problem

CPGRAMS (pgportal.gov.in) is India's single portal for filing grievances against any central or state government department. It's genuinely useful, but two structural gaps quietly sabotage citizens:

- **The 3-transfer limit.** A grievance can only be transferred between departments three times in its entire lifecycle. If a citizen files under the wrong department or category, they can burn through transfers and the grievance effectively dies or loops, with no fault of their own — just because they didn't know the right category out of thousands.
- **No upfront expectation-setting.** Nobody tells a citizen that their type of complaint typically takes 10 days in one department and 45 in another. People wait blind and don't know when it's reasonable to escalate.
- **No resolution-quality check.** Departments can close a grievance without truly resolving it. The government's own upcoming "NextGen CPGRAMS" plans *internal* AI validation to catch this — but that's for the government's own auditing, not for the citizen. There is currently no citizen-facing tool that tells someone "this reply didn't actually answer your complaint — here's how to appeal."

**Important honesty check (already researched):** NextGen CPGRAMS already plans AI-based categorisation, intelligent routing, a multilingual chatbot, and automated escalation. A World Bank-linked prototype ("CivicBridge") already does natural-language routing trained on real CPGRAMS data. So **routing/intake AI is not our differentiator** — it's already being built, twice. Our differentiator is everything *after* that: expectation-setting with real data, and citizen-side resolution-quality checking + appeal drafting. We should say this explicitly in the write-up — it shows judges we did real competitive research, not just a cool idea in a vacuum.

---

## 3. Who it's for

- First-time CPGRAMS users who don't know the category taxonomy exists
- People with low digital literacy or limited English — the avatar lets them just *talk*
- People with limited free time — no repeated portal navigation trial-and-error
- People whose grievance was closed and who don't know if that's the real end of the road

---

## 4. Hard guardrails — what we are explicitly NOT building

These came out of earlier discussion and matter a lot for both the rules and the judging "honesty" criterion:

- ❌ No real Aadhaar, PAN, OTP, or payment data — anywhere, ever. Verification is a clearly-labeled **mocked** mobile OTP flow.
- ❌ No automation, scripting, or field-filling on the live CPGRAMS/pgportal.gov.in site. No DOM injection, no browser agent logging into a real government session. This is a bright line, not a style choice — it's explicitly forbidden by the brief and it's also fragile/unreliable to build.
- ❌ AI never makes an unexplainable, black-box decision about identity, eligibility, or department routing. Every suggestion the avatar makes must be traceable to a rule or a real data point the user can see.
- ❌ No claim of being an official government product, and no misuse of government logos.
- ✅ The only "submission" that happens live is the user themselves pasting/typing into the real portal, guided by a clean summary our app hands them.

---

## 5. The user journey (step by step)

### Step 1 — Mobile verification (mocked)
- User enters a mobile number
- App shows a mock OTP screen (clearly synthetic, no real SMS gateway) — this is purely for demo realism and to show we understand identity flows exist, not a real auth system
- On "verify," proceeds to the conversation

### Step 2 — Avatar conversation
- Avatar greets the user, asks them to describe their problem in their own words, in any language/dialect ("meri society ka paani nahi aa raha", "income tax refund nahi mila", etc.)
- Avatar asks 1–2 clarifying questions only if genuinely needed (e.g. "which city/area is this in?") — kept minimal, not a long form
- Avatar reflects the understood problem back in plain language for confirmation: *"Sounds like your complaint is about no water supply in [area], is that right?"*

### Step 3 — Understanding + routing suggestion
- Text is classified into a category + department using a transparent keyword/rule + historical-pattern matcher (see Section 7 — not a black-box guess)
- Avatar shows: suggested department, suggested category, and **why** ("similar complaints are usually filed here")
- User can override the suggestion manually — the AI never forces a choice

### Step 4 — Honest expectation-setting
- Using real data.gov.in disposal-time and pendency data, avatar shows: *"Grievances like this in [department] typically take ~X days. [Department] currently has [Y]% pending beyond 21 days."*
- This is the core trust-building, transparency feature — no current portal shows this

### Step 5 — Review card (the "friendly submit")
- A clean, editable summary card: Name · Mobile · Category · Department · Description (cleaned-up version of what they said)
- User taps one big **Confirm** button — this is their moment of "submission," fully inside our app, fast and satisfying
- This is where the "AI fills, human confirms" idea lives — safely, because it's filling *our own* form, not the government's

### Step 6 — Handoff to the real portal
- Final screen: **"Your grievance is ready — tap to open CPGRAMS"**
- Opens pgportal.gov.in in a new tab/webview
- Shows the same summary in a **"Copy all"** button so pasting into the real form takes seconds
- We stop here. The user does the actual filing themselves, on the real site, with their own credentials.

### Step 7 — Later: resolution check (the standout feature)
- User comes back after their grievance is marked "closed," pastes in the reply they received
- Avatar compares the original complaint against the reply in plain, explainable terms: does the reply actually address what was asked, or is it generic/boilerplate?
- If it looks like a non-resolution, avatar drafts an appeal that quotes the citizen's unaddressed point directly back — a sharper appeal than most people would write themselves
- Shows department history again for context ("this department closes X% of grievances without a real resolution" if the data supports that)
- Same handoff pattern: copy the appeal, open the real appeal page, done.

---

## 6. What the AI is (and isn't) allowed to decide

This split matters — it's the difference between something safe to build and something that quietly becomes a liability:

| AI's job (safe, narrow) | Never the AI's job |
|---|---|
| Understand free-text/voice complaint in any language | Verify a person's real identity |
| Suggest a category/department, with a visible reason | Make a final, unexplainable routing decision |
| Compare complaint text vs. reply text for responsiveness | Judge whether a resolution is "acceptable" with no visibility into why |
| Draft an appeal in the citizen's own words | Submit anything on a live government system |
| Explain historical data in plain language | Predict/guess outcomes with false confidence |

Every AI output should be **explainable in one sentence to a non-technical judge**: "it flagged this because the reply never mentioned the water pipeline the user asked about."

---

## 7. Data sources — how data.gov.in actually gets used

Confirmed real, usable datasets:

- **"Monthly Department-wise public grievance receipts and disposals through CPGRAMS"** — data.gov.in/catalog — feeds the department-level expectation-setting (Step 4) and post-resolution context (Step 7)
- **Month-wise complaints received/resolved by ministry/department** (historical, 2016 onward) — used to seed realistic category → department mapping instead of inventing one, and to show trend context
- DARPG's published monthly summary reports (average closing time per ministry, state/UT pendency, departments with backlogs beyond 21 days) — used for the "here's what to expect" transparency layer

**How it's structured for the build:**
1. Pull the raw department/category/time-to-close tables
2. Build a lightweight lookup: `category → [likely departments, avg closing days, pendency %]`
3. This lookup powers both Step 3 (routing suggestion) and Step 4 (expectation-setting) — same data, two uses
4. Everything here is fully real and demoable — this is the part of the build you can honestly claim as "not mocked"

---

## 8. Architecture & tech stack

- **Frontend:** conversational avatar UI (chat bubble + optional text-to-speech), mobile-first, works on slow connections — simple chat UI gets ~90% of the accessibility win without needing a heavy animated avatar
- **Classification layer:** rule/keyword matcher first, OpenAI model as a fallback for messier free text — always returns a visible reason, not just a label
- **Data layer:** preprocessed data.gov.in tables (CSV → simple lookup structure, no need for a heavy DB for a hackathon build)
- **Resolution-check layer:** text similarity + coverage check (does the reply address the key nouns/asks in the complaint) — deterministic and explainable, AI only for phrasing the appeal draft
- **No live integration** with pgportal.gov.in beyond opening it as a link — deliberate, not a limitation to hide
- **Built with Codex:** use it to scaffold the chat UI, the classification/lookup pipeline, and the appeal-drafting logic — and say so specifically in the write-up (which parts Codex built or refactored), since the brief wants Codex to be a meaningful part of the *build process*, not just present in the stack

---

## 9. What's real vs. mocked (be explicit about this in the submission)

**Real / functional:**
- The department/category lookup and expectation-setting, built on actual data.gov.in disposal data
- The conversational understanding of a free-text complaint
- The resolution-quality comparison logic
- The appeal drafting

**Mocked (clearly labeled as such):**
- Mobile OTP verification
- Actual submission to CPGRAMS (handoff link only)
- Any personal identity data

---

## 10. MVP scope for a 5-day build

**Must-have (demo-critical):**
- Avatar chat interface, text-based (voice is a stretch goal)
- Mock mobile verification screen
- Category/department suggestion with visible reasoning
- Expectation-setting screen using real data.gov.in numbers
- Review card + confirm + handoff-to-portal screen
- One complete resolution-check example (paste complaint + reply → get appeal draft)

**Nice-to-have if time allows:**
- Text-to-speech for the avatar
- Multi-language input (even 2–3 languages is a strong demo moment)
- A small dashboard showing department "track record" stats

**Cut for now:**
- Any real portal automation
- Full voice input/output pipeline
- Any live SMS/OTP gateway
- The earlier, separate passport-document-matching idea (different problem, don't split focus)

---

## 11. How this maps to the judging criteria

- **Problem:** real, well-documented (3-transfer limit, blind waiting, fake-closure risk)
- **Working build:** the full Step 1–6 journey should genuinely run end-to-end in the demo, plus one working Step 7 example
- **Usability:** conversational, no need to know government category taxonomy
- **Product thinking:** explicitly differentiated from NextGen CPGRAMS and CivicBridge, with reasoning shown
- **End-to-end thinking:** real data pipeline, explainable classification, deliberate non-integration boundary
- **Honesty:** clear real-vs-mocked breakdown, explicit "what we chose not to build and why"

---

## 12. Known limitations / future work (for the write-up)

- Real submission would require an official API partnership with DARPG/NIC — not something buildable without that access, similar to how UMANG is an officially sanctioned CPGRAMS wrapper
- Resolution-quality detection is a heuristic, not a legal judgment — it flags for the citizen's attention, it doesn't claim authority
- Category/department mapping is only as good as the historical data patterns — should be reviewed by DARPG before any real deployment
- Multilingual coverage in the MVP demo is limited to what's feasible in 5 days; full 22-language support is a stated future goal, not a hackathon claim

---

## 13. UI Redesign & Information Architecture

Instead of building a separate companion app, the plan is now to **redesign the CPGRAMS-style interface itself** — same functions, radically simplified structure — with the AI avatar as an optional layer, never a forced one.

**Problems identified from the current live site (reference screenshots reviewed):**
- The same "View Status" function is reachable from three inconsistent places (top nav dropdown, a homepage card, and again inside the "Grievance" dropdown)
- Six top-level nav menus for what's really three user intents (lodge, track, get help); one dropdown ("Redress Process") contains a single item
- The homepage hero space is a rotating promotional carousel; the actual action buttons are pushed below a full paragraph of "About CPGRAMS" text
- Legal/informational content (RTI exclusions, CSC fee warning, DPG escalation note) sits in the main flow instead of a dedicated Help page
- The site's existing AI chatbot ("Samadhan Didi") is promoted as a forced, dominant banner rather than an optional tool

**Redesign principles:**
1. **Homepage = 3 clear tiles, above the fold:** Lodge a Grievance · Track Status / Appeal (status + appeal merged into one place, removing the duplication) · Get Help / How It Works
2. **Reference/legal content moves, doesn't disappear** — About CPGRAMS, exclusions, nodal officer info, and process-flow diagrams live in a proper Help/Resources page; homepage shows one line + "read more"
3. **The AI avatar is a small persistent icon**, available on every screen including mid-form, never a takeover banner. A user who wants to complete the entire flow manually — no AI, no chat — can do so exactly as before, with zero friction or interruption.
4. **No function is removed**, only reorganized — this is important to state explicitly in the write-up, since the brief warns against "a cleaner screen over the same broken process." The redesign is the *delivery mechanism* for the deeper fixes (Sections 5–7: honest expectation-setting, transparent routing, resolution-quality check) — not a cosmetic reskin on its own. Judges should see both halves working together.

**Demo strategy:** show the current cluttered site briefly (the "before"), then the redesigned flow (the "after") — both with AI switched off (pure manual path, unchanged functionality) and with AI switched on (same path, assisted). This directly demonstrates the "if they don't want to use AI, it's not a problem" requirement.

---

## 14. Suggested task split (adjust to your team size)

1. **Data pipeline** — clean and structure the data.gov.in datasets into the category/department/time lookup
2. **Classification + resolution-check logic** — the rule engine + AI fallback, kept explainable
3. **Frontend/avatar UI** — chat interface, review card, handoff screens
4. **Write-up + demo video** — problem framing, differentiation from NextGen CPGRAMS/CivicBridge, real-vs-mocked breakdown, 3-minute walkthrough
