# Deep Flow & Functionality Map — 10 Indian Government Digital Platforms

**Purpose:** This file is our internal research base for the "What to Build" hackathon (Codex / OpenAI, deadline 28 Aug 2026 8PM IST). For each of the 10 official platforms shortlisted by the organizers, it covers: what the platform actually does, the exact citizen journey today, what we can reasonably infer about the backend, and — most importantly — the *documented, real* pain points, complaint patterns, and numbers we can use as hooks.

**A note on backend architecture:** None of these platforms publish their internal system design. Anything below marked **[public/confirmed]** comes from official disclosures (Parliament answers, PIB releases, ministry portals) or well-documented industry reporting. Anything marked **[inferred]** is our best technical guess based on how the citizen-facing flow behaves (timeouts, queueing behaviour, form validation patterns) — treat it as a working hypothesis for our own architecture, not a fact to repeat to judges as confirmed.

---

## 1. IRCTC — Indian Railway Catering & Tourism Corporation

### What it is
IRCTC is the sole authorized online ticketing arm of Indian Railways, running the passenger reservation booking layer (irctc.co.in, Rail Connect app) on top of the Railways' own PRS (Passenger Reservation System) and CRIS (Centre for Railway Information Systems) infrastructure.

### The citizen journey today
1. **Login/registration** — account with mobile/email OTP; profile includes a "Master List" of up to 20 saved passengers to speed up form-filling.
2. **Search** — source, destination, date, class, quota (General/Tatkal/Premium Tatkal/Ladies/Senior Citizen/etc.).
3. **Train & class selection** — availability shown as CNF (confirmed), RAC, or WL (waitlist) with a number.
4. **Passenger entry** — name, age, gender, berth preference, food choice, ID proof for concession categories — manually re-typed every time unless Master List is used.
5. **Payment** — UPI, cards, net banking, IRCTC eWallet.
6. **Confirmation / PNR generation**, chart preparation happens 4 hours before departure (or earlier for originating trains), after which waitlisted tickets are either confirmed, moved to RAC, or stay waitlisted (and are auto-refunded if fully waitlisted after chart prep).

### Tatkal — the special flow
Tatkal opens exactly one day before departure **from the train's origin station** — 10:00 AM for AC classes, 11:00 AM for non-AC. It is a race-condition window: thousands of users hit "search" at the same second. As of 2026, Indian Railways has layered in:
- **Mandatory Aadhaar-linked OTP authentication** for online Tatkal booking — the OTP goes to the mobile number linked to Aadhaar at UIDAI, *not* necessarily the IRCTC-registered number, which itself is a fresh source of user confusion.
- A cap of 4 passengers per PNR, and agents are blocked from booking in the first 30 minutes.
- **Premium Tatkal** — a dynamic-pricing variant (fares rise as seats sell), no waitlist issued (only CNF/RAC), zero refund on cancellation, and agents are barred entirely.
- Separately, **physical PRS counters moved to a numbered token system starting 1 August 2026**, replacing the old first-come queue — i.e., Railways has already validated "fair queueing beats race conditions" for the offline channel, but the *online* channel still runs on raw request-speed.

### Backend & architecture
**[inferred]** The booking engine is almost certainly a high-concurrency inventory-locking system (likely BASE, not strict ACID, given the "booking failed" errors under load) sitting in front of PRS's seat inventory, with a CAPTCHA/anti-bot layer added post-2026 alongside Aadhaar OTP. **[public/confirmed]** IRCTC has publicly acknowledged automated bot/agent abuse of Tatkal as the reason for the tightened authentication.

### Where it breaks
- Tickets "vanish within minutes/seconds" of the window opening — a chronic, decade-old complaint that pushed the entire 2026 rule overhaul.
- The verification layer (Aadhaar OTP not matching IRCTC's registered number) creates a new failure mode for genuine users.
- No transparent "queue position" — a user has no way to know if they lost to a genuine faster human or a script; this *opacity* is itself the trust problem, not just the speed problem.
- TDR (refund) filing for a missed/cancelled Tatkal ticket is a separate multi-step process most users don't know exists.
- Confirmed Tatkal tickets carry **zero refund** — a rule most first-time users discover only after a cancellation.

### Numbers worth knowing
IRCTC processes tens of millions of transactions during peak season; industry commentary consistently cites Tatkal seats selling out in **under 60 seconds** on trunk routes (Delhi–Mumbai, Howrah–Chennai, Bengaluru–Ernakulam). The shift to a token system at counters (Aug 2026) is a live signal that Railways itself now accepts fairness > speed as the design principle — but only offline so far.

### Data for our POC
Mock PNR/train/seat data (schema mirrors public PNR status fields); `data.gov.in` has limited live railway datasets (mostly GIS/freight, not real-time seat inventory) — for a working demo we will need **synthetic** train/seat/passenger data, not real scraped data (also explicitly disallowed by the brief).

---

## 2. Income Tax e-Filing Portal (incometax.gov.in)

### What it is
The Income Tax Department's self-filing and account-management portal for individuals, HUFs, and businesses — currently on its 2.0/3.0 generation architecture, run by Infosys under a government contract, integrated with CPC (Centralised Processing Centre, Bengaluru) for return processing.

### The citizen journey today
1. **Login** via PAN + Aadhaar-linked OTP (PAN must be Aadhaar-linked or it becomes inoperative and blocks refunds entirely).
2. **Pre-filing reconciliation** — the taxpayer cross-checks **Form 26AS** (TDS credit ledger), **AIS** (Annual Information Statement) and **TIS** (Taxpayer Information Summary) against their own records; these three documents frequently disagree with each other.
3. **ITR form selection** (ITR-1 through ITR-7) and filling — either via the portal's own utility or offline JSON/Excel utilities uploaded back.
4. **e-Verification** — Aadhaar OTP, net banking, or DSC, mandatory to complete the filing.
5. **Processing** — CPC issues an **Intimation Order under Section 143(1)**; refunds (or demands) are computed here. Discrepancies trigger **Section 245 adjustments** against past dues, silently reducing the refund.
6. **Refund** — credited to a pre-validated bank account; if bank details are stale, a manual **"Refund Reissue Request"** must be filed.
7. **Grievance** — via the portal's own e-Nivaran/grievance module, or CBDT's grievance channel, if unresolved after 60 days.

### Backend & architecture
**[public/confirmed]** Data flows in from multiple silos — banks (TDS/TCS), employers (Form 16), stock exchanges, high-value transaction reporters — into AIS/TIS. **[inferred]** These feeds are batch-reconciled rather than real-time, which is the likely root cause of the mismatch complaints: a bank's TDS filing can lag the taxpayer's own filing, so AIS shows "0" where the taxpayer's Form 16 shows a credit.

### Where it breaks
- **Last-day glitches are close to an annual ritual.** Chartered accountant bodies (ICAI) have formally written to the department multiple recent years about AIS/26AS access failures and login outages concentrated right before the deadline; the department's standard public response is that "the portal is working fine," with no extension — creating a credibility gap between citizen experience and official messaging.
- **Refund delays with no visible reason.** Parliamentary-level reporting in 2026 flagged over **24 lakh taxpayers** with returns pending beyond 90 days, attributed to processing backlogs, AIS/26AS mismatches, and a compliance-nudge campaign — but the taxpayer-facing status simply says "processing," with no breakdown of *which* of these four reasons applies to them.
- **PAN-Aadhaar delinking silently blocks refunds** — a structural trap many taxpayers don't discover until money doesn't arrive.
- Section 245 adjustments (refund reduced to offset old demand) are disclosed only inside a PDF intimation order most taxpayers never open.

### Numbers worth knowing
~8.8 crore ITRs filed in the referenced assessment year; **24 lakh+ stuck beyond 90 days** is a citable, recent (2026) parliamentary figure. Estonia's tax portal — built on the X-Road interoperability layer — processes most individual filings in **under 3 minutes** because bank/employer/government data already reconciles automatically before the citizen ever opens the form; India's AIS/26AS/Form-16 three-way mismatch problem is structurally the same gap X-Road was built to close.

### Data for our POC
Synthetic Form 16 / 26AS / AIS records with deliberately injected mismatches (to demonstrate the reconciliation engine); no real PAN/Aadhaar data.

---

## 3. CPGRAMS — Centralised Public Grievance Redress and Monitoring System

### What it is
DARPG's (Department of Administrative Reforms and Public Grievances) single grievance window connecting citizens to every central ministry and (via role-based state access) most state departments — the backbone grievance layer that EPFO, Railways, GST and others plug into.

### The citizen journey today
1. **File a grievance** — category, sub-category, ministry/department, free-text description, optional attachments; available via web, standalone app, and inside UMANG.
2. **Routing** — auto-assigned to the relevant Grievance Redressal Officer (GRO) based on category/department.
3. **Resolution window** — a **21-day prescribed timeline**; average actual disposal time nationally was **15 days** as of early 2026.
4. **Feedback & appeal** — after closure, the citizen rates the resolution; a **"Poor" rating unlocks a formal appeal** to a higher authority.
5. **Escalation ladder** — GRO → higher officer → (for specific schemes) ministry-level review; states have their own nodal officers.

### Backend & architecture
**[public/confirmed]** CPGRAMS runs a "10-Step Reform" workflow (introduced 2022, deepened 2024-25) with senior-officer review layers and officer accountability mapping. A **Next-Generation CPGRAMS** (modular, analytics-driven) launched June 2025, and an **Intelligent Grievance Monitoring System (IGMS) 2.0** with AI/ML-based auto-categorization and resolution-time prediction rolled out in late 2024. **[inferred]** The AI layer currently seems focused on *routing/categorization*, not on *verifying whether the resolution actually solved the problem* — the system counts a grievance as "disposed" once a GRO marks it closed, regardless of resolution quality, unless the citizen proactively rates it poorly and appeals.

### Where it breaks
- **Pendency is real and geographically skewed** — national pendency stood at **1,92,877 grievances** in a recent monthly snapshot, with Maharashtra (~33,000) and Uttar Pradesh (~24,000) carrying the largest backlogs; **5,845 of ~71,887 pending central-government grievances were older than 90 days** as of Jan 2026.
- **"Resolved" ≠ "actually fixed."** The appeal mechanism only activates if the citizen actively rates the closure "Poor" — most citizens don't know this option exists, so low-quality boilerplate closures likely go unchallenged at scale (a widely echoed criticism of high-volume grievance systems generally).
- The system explicitly **excludes** RTI matters, sub-judice cases, and personal/family disputes — a boundary many citizens don't understand before filing, wasting a cycle.
- Common Service Centre (CSC)-routed grievances are concentrated in a few states (Karnataka alone contributed over half of CSC-routed grievances in a recent month) — signalling uneven rural digital-access-point coverage elsewhere.

### Numbers worth knowing
Over **80 lakh grievances redressed 2022–mid-2025**; a **74% reduction in pendency since 2021** is DARPG's own headline claim; **₹270 crore** allocated in Dec 2024 specifically for the next-gen platform; **33,775+ Grievance Redressal Officers trained** over four years under the Sevottam capacity-building scheme.

### Data for our POC
Synthetic grievance text corpus (varied categories: PM-KISAN, PDS, pension, mobile/telecom — the three sectors flagged as highest-volume) with paired "closure remarks" of varying real quality, to demonstrate a resolution-quality classifier.

---

## 4. GST Portal (gst.gov.in) — GSTN

### What it is
The Goods and Services Tax Network (GSTN), a government-owned company, runs the compliance backbone for India's ~1.4+ crore registered taxpayers: return filing, invoice matching, e-way bills, and payments.

### The citizen journey today
1. **GSTR-1** (outward supplies / sales) — monthly or quarterly (QRMP scheme), due around the 11th–13th of the following month.
2. **GSTR-2B** — auto-populated read-only statement of input tax credit (ITC) available, generated from suppliers' GSTR-1 filings.
3. **Reconciliation** — the taxpayer (or their accountant) manually cross-checks purchases against GSTR-2B to claim correct ITC.
4. **GSTR-3B** — the summary return where tax liability is actually declared and paid, typically due the 20th–24th, with staggered due dates by state group.
5. **E-way bill generation** for goods movement above threshold value, a separate sub-system.
6. **Notices/Show-cause** if mismatches trigger department scrutiny.

### Backend & architecture
**[public/confirmed]** GSTN has repeatedly and publicly acknowledged "technical issues" and gone into "maintenance" mode in the final hours before filing deadlines — this is not speculation, it is GSTN's own social-media-issued incident reports. **[inferred]** The system appears to lack effective load-shedding or demand-smoothing: filing volume clusters entirely in the last 24–48 hours of each due-date window (a universal small-business behaviour pattern — people file when the deadline forces them to), and the infrastructure has repeatedly been unable to absorb that peak without CBIC issuing a reactive 1–2 day extension.

### Where it breaks
- **This is a recurring, almost seasonal failure**, not a one-off: technical-glitch-driven due-date extensions are documented in April 2024, January 2025, and continuing complaint patterns into 2026 — always in the last 24 hours before a due date, always followed by a public GSTN acknowledgment and a CBIC extension notification.
- GSTR-1 and GSTR-3B are **interdependent** (2B is built from 1, 3B liability depends on 2B), so an outage anywhere in the chain cascades — a delay in one return forces extensions on the other.
- Small businesses without in-house accountants struggle most with reconciliation between 1/2B/3B, disproportionately hitting India's ~6.3 crore MSMEs.
- GSTR-1 older than **3 years past due date is now permanently blocked** by the portal (a 2026 rule) — meaning old compliance gaps become permanently unfixable, an unusually harsh design choice with real business consequences.

### Numbers worth knowing
Deadline extensions of **2 days**, repeatedly, driven by portal-side (not taxpayer-side) failure, is a strong "the system, not the citizen, is the bottleneck" narrative — useful for framing any GST idea as an *infrastructure* fix rather than a UX skin.

### Data for our POC
Synthetic invoice-level sales/purchase ledgers with a simulated ITC mismatch and a simulated load-vs-time filing curve (to demonstrate demand-smoothing).

---

## 5. EPFO — Employees' Provident Fund Organisation

### What it is
India's retirement-savings and pension body for the organized-sector workforce, built around the **UAN (Universal Account Number)** — a 12-digit lifetime ID linking a member's EPF accounts across employers.

### The citizen journey today
1. **UAN activation & KYC** — Aadhaar, PAN, bank account seeding, all of which must exactly match across databases.
2. **e-Nomination** — mandatory before most claims process; requires nominee Aadhaar + photo.
3. **Claim filing** — Form 19 (final PF settlement), Form 10C (pension withdrawal benefit), or Form 31 (partial/advance withdrawal), filed online against the UAN.
4. **Employer step — Date of Exit (DOE)** — critically, the **previous employer must mark the employee's exit date** in the system before a full/final claim can be processed; if HR doesn't do this (common after a job change dispute or employer inaction), the claim silently stalls with no visible reason to the employee.
5. **Claim settlement** — EPFO's own Citizen Charter commits to **20 days**; real-world experience varies.
6. **Grievance** — via **EPFiGMS** (EPF-specific portal) → if unresolved, escalate to **CPGRAMS** → if still unresolved, an **RTI request** is a documented last resort many users end up using just to find out *why* a claim is stuck.

### Backend & architecture
**[public/confirmed]** Claims route through a Regional PF Commissioner (RPFC) office structure, escalating to zonal Additional Central PF Commissioners and finally the Central PF Commissioner. **[inferred]** There does not appear to be a proactive notification when an employer fails to mark DOE — the burden falls entirely on the employee to notice the stall and chase both the employer and EPFO manually, often over weeks.

### Where it breaks
- **Rejections without a clear reason** are common enough to have generated an entire self-help ecosystem (RTI-based workarounds, "insider guides") — the most cited real reasons are KYC mismatch, signature mismatch, incorrect bank details, missing employer attestation, and unmarked Date of Exit.
- A documented real case: a claim stalled for months because a former employer falsely claimed to HR/EPFO that the exit date was marked in November when it was actually marked only the following February — discoverable only via an RTI request, since EPFiGMS itself gave no such detail.
- The escalation ladder (EPFiGMS → CPGRAMS → RTI) is **three separate systems with three separate logins/formats** just to chase one stuck claim — a severe cross-system UX failure.
- EPFO's own citizen charter promises 20 days; a claim sitting as "Under Process" past that with zero explanation is the single most common grievance category.

### Numbers worth knowing
UAN covers the formal-sector workforce (tens of crores of subscribers over the scheme's lifetime); "PF Withdrawal Delay" is explicitly documented as **the most common EPFO grievance category**.

### Data for our POC
Synthetic UAN/claim records including deliberately-unmarked-DOE and KYC-mismatch scenarios, to demonstrate pre-submission validation and employer-side accountability.

---

## 6. MCA21 (Ministry of Corporate Affairs) — Version 3

### What it is
The statutory filing and company registry backbone for every registered company and LLP in India — incorporation (SPICe+), annual filings (AOC-4, MGT-7/7A), DIN/DSC management — run by MCA, migrated in phases from V2 to a browser-based V3 architecture, largely completed through 2025.

### The citizen journey today
1. **Name reservation & incorporation** via **SPICe+**, an integrated form bundling company name approval, DIN allotment, PAN, TAN, GST registration, and bank account opening in one filing.
2. **Ongoing statutory filings** — annual returns (MGT-7/7A), financial statements (AOC-4/AOC-4 XBRL), event-based filings (director changes, share allotments), each routed through **DSC (Digital Signature Certificate)** verification.
3. **Processing centres** — filings move through the **CRC** (Central Registration Centre), **CPC** (Central Processing Centre), **CSC** (Central Scrutiny Centre), and **C-PACE** (Centre for Processing Accelerated Corporate Exit) depending on filing type.
4. **Grievance** — call centre, web tickets, live chat (added specifically in response to V3-era complaints).

### Backend & architecture
**[public/confirmed]** V3 replaced the old "download form, fill offline, upload" V2 model with in-browser filing, form validation, and dynamic-form updates that adapt to legislative changes without a full portal overhaul. **[inferred]** The dynamic-validation engine appears to be aggressive/brittle — professional bodies have documented multiple 2025 instances of the same submitted data being rejected on resubmission due to validation-rule inconsistencies, suggesting the rules engine and the data-persistence layer aren't always in sync.

### Where it breaks
- **This is one of the most concretely, recently documented failure sets of any platform here.** ICSI (Institute of Company Secretaries of India) formally wrote to MCA in September and December 2025 detailing: OTP generation failures for DSC-linked forms (especially for foreign nationals), incorrect prefilled data pulled into forms, "Validation Error: Submission Restricted" messages with no clear cause, DSC verification failing despite correct registration, approved forms not reflecting in MCA's own master data, password resets failing with generic "Something went wrong" errors, and attachment size limits blocking legitimate filings (e.g., large shareholder lists in MGT-7).
- These issues were severe enough that MCA extended the FY 2024-25 annual filing deadline to **31 December 2025**, and professional bodies were still requesting further extension to **31 March 2026** because the underlying glitches hadn't been fixed even after the first extension.
- Scale context: **84.31 lakh forms filed** and **~1.6 lakh new companies registered** in the Apr 2024–Feb 2025 window alone — a portal failure here has enormous compounding downstream effect (SMEs alone filed over 72,000 statutory documents in that period).

### Numbers worth knowing
84.31 lakh forms (Apr'24–Feb'25); 1,59,982 new company registrations in the same window; 21,06,788 annual filings, of which the government's own data admits **~3.3% were affected by technical issues** — at that scale, 3.3% is tens of thousands of businesses.

### Data for our POC
Synthetic SPICe+ and AOC-4/MGT-7 form datasets with the *specific* documented failure patterns above (prefilled-data mismatch, validation-rule conflicts) to demonstrate a pre-submission diagnostic.

---

## 7. National Cyber Crime Reporting Portal (cybercrime.gov.in) + Helpline 1930

### What it is
Run by the **Indian Cyber Crime Coordination Centre (I4C)** under the Ministry of Home Affairs, this is the unified channel for citizens to report cybercrime — with a special, higher-priority sub-system, the **Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)**, specifically for financial fraud, launched in 2021, tightly coupled to the **1930 helpline**.

### The citizen journey today
1. **Report** — via the web portal (general cybercrime complaint) or by calling **1930** (financial fraud specifically), which is faster and routes directly into CFCFRMS.
2. **The "golden hour" mechanism** — for financial fraud, if reported fast enough, I4C's system can trigger a **multi-bank, multi-payment-processor coordinated freeze** on the fraudulently transferred funds before they're layered/withdrawn by the fraudster — this is the system's single most valuable and time-sensitive function.
3. **Escalation to FIR** — historically a separate, slower step requiring the victim to also go to local police; a pilot **"e-Zero FIR"** system (Delhi, since May 2025) auto-converts high-value CFCFRMS complaints directly into a First Information Report, and I4C has proposed **expanding this nationwide**.
4. **Coordination layer** — a **Cyber Fraud Mitigation Centre (CFMC)** brings banks, telecom operators, and law enforcement together for real-time action on live cases.
5. **Ancillary enforcement** — SIM card and IMEI blocking tied to numbers used in fraud (lakhs blocked to date).

### Backend & architecture
**[public/confirmed]** This is a genuinely multi-agency real-time coordination system, not just a complaint form — CFMC's bank/telecom/law-enforcement integration is publicly documented as functioning infrastructure, not aspirational. **[inferred]** The general web-portal complaint form (for non-urgent cybercrime) appears to be a much slower, multi-field, multi-category form — reasonable for a permanent record, but a poor fit for someone actively watching money leave their account in real time, where every extra form field costs recoverable rupees.

### Where it breaks
- **Awareness and speed, not the backend, are the bottleneck.** The mechanism to freeze funds exists and works — the government's own recovery figures prove it — but relies entirely on the victim recognizing fraud and reporting within a narrow window, which is exactly when victims (especially elderly, or those under active "digital arrest" psychological manipulation) are least equipped to navigate a detailed government form.
- "**Digital arrest**" scams (fraudsters impersonating police/CBI/RBI officials on video calls to coerce victims into transferring money) are explicitly flagged by I4C as a major, growing threat category, with thousands of associated Skype IDs and tens of thousands of WhatsApp accounts already blocked.
- e-Zero FIR — the fix for the "report to portal, then separately go to police" friction — is **still only a Delhi pilot** as of the most recent reporting, not yet nationwide.

### Numbers worth knowing
As of a Dec 2025 parliamentary answer: **more than ₹7,130 crore saved across 23.02 lakh complaints** under CFCFRMS since 2021 — this number has climbed steadily in every successive government disclosure (₹3,431 cr in late 2024 → ₹4,386 cr by Feb 2025 → ₹7,130 cr by Dec 2025), meaning it's a metric the government actively tracks and is proud of. **9.42 lakh SIM cards and 2,63,348 IMEIs blocked**; **₹782 crore** allocated to cybersecurity in the 2025-26 Union Budget; NCRB reported **cybercrime cases up over 30%** year-on-year, with fraud the dominant category.

### Data for our POC
Synthetic fraud-scenario data (mock transaction, mock bank/UPI-handle lookup, mock "freeze" API response) to demonstrate a fast, panic-optimized reporting flow and a simulated golden-hour countdown.

---

## 8. UMANG (Unified Mobile Application for New-age Governance)

### What it is
MeitY/NeGD's single "app of apps" — a super-app aggregating **1,000–1,200+ services** from central ministries, states, and PSUs onto one platform (mobile app, web, IVR, and SMS), integrated with Aadhaar, DigiLocker, and the BHIM/PayGov payment layer.

### The citizen journey today
1. **Discovery** — browse or search across a very large, flat catalogue of services spanning healthcare, finance, education, housing, energy, agriculture, transport, and utilities.
2. **Access** — Aadhaar-based or department-specific authentication per service (not always a single unified login experience across services).
3. **Use** — the underlying transaction (check EPF balance, pay a utility bill, book a gas cylinder, access CBSE results, file a CPGRAMS grievance, etc.) happens inside UMANG's shell but is ultimately fulfilled by the source department's own backend.
4. **Documents** — DigiLocker-issued documents surface directly on the home screen.
5. **Assisted Mode** — for citizens without smartphones or digital literacy, UMANG explicitly offers delivery through **12 assisted-service partners including Common Service Centres (CSCs)**.

### Backend & architecture
**[public/confirmed]** UMANG's own stated design goal is that departments can integrate a new service **within a week**, without hiring an external agency — i.e., it is architected as an integration/API layer sitting in front of hundreds of independent departmental backends, not a monolith. **[inferred]** Because each integrated service still ultimately depends on its source department's own system health (UMANG's EPF service is only as reliable as EPFO's backend, etc.), UMANG effectively inherits every pain point already documented in this file for EPFO, CPGRAMS, and others — it is a discovery/access layer, not a fix for the underlying service quality.

### Where it breaks
- **Discovery, not access, is the core UX gap.** With 1,000+ flat services, a citizen has to already know the name of what they want ("PM-KISAN," "Kisan Sarathi," "Coffee Board Grower Registration") to find it — there is no "life event" or "what do I need right now" organizing layer; the system explicitly markets itself as helping "discovery of relevant services," which is itself an admission this isn't solved yet.
- Service quality is inherited, not improved — UMANG cannot fix an EPFO claim delay or a CPGRAMS boilerplate closure; it just gives you another door into the same backend.
- Regional/service availability is inconsistent — the platform itself notes that "availability of services depends on department integration and regional support," meaning the promise of a single unified experience is uneven in practice across states.

### Numbers worth knowing
**1,000–1,200+ services**, **23 languages** supported on the newer catalogue (13 on some listings — versions vary by source/date), **12 assisted-service delivery partners**, missed-call/SMS-based install flow (`9718397183`) specifically designed for feature-phone accessibility — a genuinely inclusive design choice worth studying.

### Data for our POC
A synthetic "citizen life-event graph" (e.g., birth, first job, marriage, retirement — each mapped to a bundle of real UMANG-hosted services) to demonstrate a proactive/bundled experience layered on top of the existing flat catalogue.

---

## 9. Parivahan Sewa (Sarathi + Vahan)

### What it is
MoRTH's (Ministry of Road Transport and Highways) national portal unifying **Sarathi** (driving licences) and **Vahan** (vehicle registration), connecting **1,300+ RTOs** across states into one citizen-facing system.

### The citizen journey today
**Driving Licence path:** Learner's Licence (LL) application → online **LL test** (often now conducted online/contactless) → **slot booking for the permanent DL driving test** via the "Appointments" tab → physical test at the RTO → DL issued and posted via Speed Post. Renewal (DLs valid ~20 years or till age 50) requires **Form 1A medical certificate** for applicants over 40.

**Vehicle path:** New registration (via dealer, typically), RC renewal (Form 25 + insurance + PUC + physical inspection slot for older vehicles), ownership transfer (seller files **Form 29**, buyer files **Form 30** within 14 days), interstate transfer (NOC via **Form 28**), and the newer **BH-series** registration for portable, pan-India-valid registration (requires job-transfer proof).

**Payments/challans** — e-Challan lookup and payment is a separate, heavily-used sub-flow.

### Backend & architecture
**[public/confirmed]** Slot booking windows for driving tests open at fixed times (commonly 10:00–11:00 AM) per RTO/state and fill within minutes — publicly documented across multiple independent guides, with the standard advice being "log in 5 minutes early." **[inferred]** Slot capacity appears to be a hard-capped daily allocation per RTO with **no visible mechanism to reclaim unused capacity from no-shows** in real time — once a slot is booked, whether or not the applicant shows up, that capacity is effectively lost to everyone else that day.

### Where it breaks
- **"No Free Slots" for 30–90 days** is explicitly documented as a common, structural failure — not user error — driven by capped daily slots against overwhelming demand.
- **Document rejection loops** — wrong format, low-resolution scans, incorrect form version — force repeat RTO visits; the standard citizen workaround (agents/touts) undermines the entire "no queues, no middlemen" premise digitization was meant to deliver.
- Despite the portal existing, **agent dependency persists** — an ironic, well-known outcome where digitization moved the queue online but didn't remove the informal economy built around navigating it.
- Interstate and BH-series rules are genuinely complex (job-proof requirements, state-specific variations for the "same" nominal service), creating friction that disproportionately hits migrants and transferred employees — exactly the population BH-series was designed to help.

### Numbers worth knowing
**1,300+ RTOs** connected nationally; DLs are typically valid **~20 years or to age 50**; over-40 renewals require a medical certificate (Form 1A) — a compliance step frequently missed, causing renewal rejections.

### Data for our POC
Synthetic RTO slot-calendar data (with realistic scarcity + no-show patterns) and a synthetic document-quality dataset (good/bad scans) to demonstrate fair allocation and pre-submission document checking.

---

## 10. RTI Online (rtionline.gov.in)

### What it is
DoPT's (Department of Personnel & Training) portal for filing Right to Information Act, 2005 requests and first appeals against **central** government public authorities only, with an integrated payment gateway; the Central Information Commission (CIC) runs a linked but separate second-appeal system.

### The citizen journey today
1. **File** — select the public authority/ministry, write the information request, pay the statutory fee online.
2. **Routing** — the application reaches the department's **Nodal Officer**, who forwards it to the correct **CPIO (Central Public Information Officer)**.
3. **Response window** — the law mandates a **30-day response**; if additional fees are needed (for voluminous information), the CPIO intimates the applicant through the portal.
4. **First Appeal** — if the response is late, incomplete, or unsatisfactory, the applicant can file a **First Appeal** (no fee) directly through the same portal, referencing the original registration number.
5. **Second Appeal** — if still unresolved, escalates to the **CIC**, which — since a recent integration — can auto-pull First Appeal details by registration number/email/date rather than requiring the applicant to re-enter everything.

### Backend & architecture
**[public/confirmed]** The portal is explicitly and strictly **scoped to central-government authorities only** — applications for state-level departments (including, notably, the Government of NCT of Delhi) are **automatically returned, with the fee forfeited, no refund**. Most major states run entirely separate RTI portals (Maharashtra, Karnataka, UP, Himachal Pradesh, Goa, etc. each have their own). **[inferred]** There does not appear to be any automatic trigger when the 30-day statutory window lapses — the burden is entirely on the citizen to notice, remember, and manually file a First Appeal; nothing in the system proactively enforces the law's own timeline on the citizen's behalf.

### Where it breaks
- **Wrong-portal filing is a designed-in trap, not an edge case.** A citizen unaware that state matters must go elsewhere loses the filing fee outright with zero recourse — a first-time RTI user has no way to know this before paying.
- **The law gives citizens a right to auto-appeal after 30 days of silence, but the system does nothing to help them exercise it** — no reminder, no auto-draft, no nudge. Given that first-time RTI filers are, by definition, often unfamiliar with the Act's mechanics, this silently defeats the law's intent for a meaningful share of users.
- Recent portal changes (Nov 2025) now require **citizen login** for new applications (a shift from a more anonymous-friendly model), which is a genuine access trade-off between security and the RTI Act's spirit of low-friction citizen oversight.
- Multiple *institutionally separate* RTI systems (central DoPT portal, ~28 separate state portals, and dedicated portals for bodies like the Supreme Court) mean there is no single place a citizen can even ask "who do I actually file this with?"

### Numbers worth knowing
The RTI Act's core numbers are procedural, not volumetric from public sources here — but they are legally binding and citable: **30-day mandatory response window**, **no fee for a First Appeal**, and a hard jurisdictional line (central vs. state) that has real financial consequences (forfeited fees) for citizens who get it wrong.

### Data for our POC
Synthetic RTI application records with simulated 30-day-lapse scenarios (to demonstrate auto-appeal drafting) and a synthetic authority-routing dataset (which ministries/bodies are "central" vs. which fall under state portals) to demonstrate a correct-portal router.

---

## Cross-Platform Observations (useful going into ideation)

1. **Scarcity + race conditions recur everywhwere seats/slots are limited** (IRCTC Tatkal, Parivahan driving-test slots) — and Railways has *already* validated fair-queueing (the Aug 2026 counter token system) as the answer, just not online yet.
2. **"Resolved" often isn't verified as actually-resolved** (CPGRAMS, and by extension anything routed through it, including EPFO's escalation ladder) — quality-of-resolution is a known, government-acknowledged gap (DARPG's own 2024-25 emphasis shift to "quality of disposal").
3. **Rejection without a clear reason is the single most repeated citizen complaint pattern** across EPFO, MCA21, and Parivahan document submissions — all three would benefit from the same underlying pattern: a pre-submission validator that predicts and prevents the rejection before the citizen wastes a filing cycle.
4. **Government-side portal overload during deadline rushes is self-inflicted and repeat-documented** (GST's GSTR-1/3B extensions, Income Tax's last-day AIS/26AS outages, MCA21 V3's persistent 2025 validation failures) — these are infrastructure/demand-smoothing problems, not citizen-education problems.
5. **The strongest, most "government can't say no" opportunities are the ones already partially built or already a stated priority** — e-Zero FIR (Cyber Crime, currently Delhi-only, expansion already announced), DARPG's "quality of disposal" push (CPGRAMS), and Railways' own token-fairness precedent (IRCTC) are not blue-sky ideas — they are the government's own next step, demonstrated early.
