# Sahayak — Full Site Recreation Spec (100% Feature Parity)

**Core principle:** this is a *recreation*, not a *replacement*. Every link, dropdown, page, notice, and footer badge on the current CPGRAMS site is accounted for below and kept. Nothing that exists today disappears in the redesign — improvement means better visual hierarchy, clearer grouping, and calmer presentation, never fewer destinations. This document exists so nobody on the team accidentally "cleans up" something a real citizen depends on.

Built directly from the seven reference screenshots of the live site.

---

## 1. Top utility bar

| Current element | Status | Improvement |
|---|---|---|
| Government of India + Ministry of Personnel, Public Grievances & Pensions branding, national emblem | Kept | Same content, cleaner spacing, no visual change to official marks (required, not ours to alter) |
| CPGRAMS logo/title (top right) | Kept | Unchanged position and content |
| Home | Kept | Same |
| Contact Us | Kept | Same |
| About Us | Kept | Same |
| FAQs/Help | Kept | Same |
| Site Map | Kept | Same |

---

## 2. Main navigation bar (maroon bar → glass bar)

| Current element | Status | Improvement |
|---|---|---|
| **View Status ▾** → Grievance Status, Appeal Status | Kept, both sub-items kept | Opens as a soft glass dropdown panel instead of a flat gray box; same two destinations |
| **Nodal PG Officers ▾** → Central Government, State Government | Kept, both sub-items kept | Same glass dropdown treatment |
| **Redress Process ▾** → Redress Process Flow | Kept as a dropdown (not force-converted to a plain link) | Visual consistency with the rest of the nav; same single destination |
| **Grievance ▾** → Lodge Public Grievance, Lodge Pension Grievance, View Status, Reminder Clarification, Rate Grievance | Kept, all five sub-items kept, **including the second "View Status" entry** | Grouped with a subtle divider: filing actions (Lodge Public/Pension Grievance) above the line, status/follow-up actions (View Status, Reminder Clarification, Rate Grievance) below it — same five links, easier to scan |
| **Nodal Authority for Appeal** | Kept as a direct link | Unchanged |
| **Mobile App** | Kept as a direct link | Unchanged |
| **Language selector** | Kept | Unchanged |
| **Sign In** | Kept, top right | Unchanged position, restyled as the one amber (primary-accent) element in the nav |

**On the duplicate "View Status" entries (nav dropdown + inside Grievance dropdown + homepage card, three total):** none are removed. A returning user who already knows "Grievance → View Status" keeps that exact path; a new user who clicks the standalone "View Status ▾" in the main bar gets there just as fast; a user who scans the homepage cards finds it there too. All three lead to the identical status page, and all three get the same glass visual treatment so they feel like one consistent product rather than three different-looking paths that happen to overlap.

---

## 3. Hero area

| Current element | Status | Improvement |
|---|---|---|
| 8-slide rotating carousel | Kept, all slides kept | Reduced height, paired alongside the CTA cards on desktop instead of forcing a scroll past it; slide dots/controls restyled in glass, same 8 slides |
| "Samadhan Didi" AI chatbot promo slide (voice-based lodging) | Kept | Same content and framing — this is the site's real, already-live AI feature; our own AI assistant (Section 7 of the Design System doc) sits *alongside* it as a persistent icon, it doesn't replace or compete with this promo |
| Multilingual script graphic (Hindi/Gujarati/Bengali/Assamese, etc.) | Kept | Unchanged, part of the same slide |
| "Any Grievance sent by email will not be entertained" disclaimer banner | Kept, full text unchanged | Restyled as a slim glass strip instead of a heavy solid maroon block — same warning, less visual weight |

---

## 4. Informational content block

| Current element | Status | Improvement |
|---|---|---|
| "About CPGRAMS" full paragraph text | Kept, full text unchanged | Presented in a glass card with better line-height/spacing; not shortened or moved off the homepage |
| "Issues which are not taken up for redress" list (RTI Matters, Court related/Subjudice matters, Religious matters, Government-employee service matters + DoPT OM reference link) | Kept, all four items + the linked reference kept | Clear icon-bulleted list inside a glass card, same content |
| Note 1 — DPG escalation guidance + "click here" link | Kept, full text and link unchanged | Same content, cleaner typography |
| Note 2 — CSC fee warning ("Government is not charging fee... money paid is going only to M/s CSC") | Kept, full text unchanged | Same content, cleaner typography — this is an important anti-fraud notice, it stays exactly as prominent in meaning even if visually calmer |
| "What's New" panel (dated PDF links, e.g. 27 July 2022 — Strengthening of Machinery..., 23 Aug 2024 — Comprehensive Guidelines...) | Kept, same dated entries and links | Restyled as a clean card list, same content and links |

---

## 5. Primary action cards

| Current element | Status | Improvement |
|---|---|---|
| Register/Login card | Kept | Same destination, glass card styling, one of the few places the amber accent appears |
| View Status card | Kept | Same destination, glass card styling |
| Contact Us card | Kept | Same destination, glass card styling |

---

## 6. Footer

| Current element | Status | Improvement |
|---|---|---|
| Facebook / X / YouTube icons | Kept | Same, grouped cleanly |
| "This site is designed, developed & hosted by NIC..." credit line | Kept, full text unchanged | Same |
| Disclaimer, Website Policies, Web Information Manager links | Kept | Same, grouped in a clear link column |
| Version number, last-updated date, total visitor count | Kept | Same, presented as small clean metadata text instead of dense small print |
| Badge row: 15-years/anniversary badge, Digital India 2018 awards, GOI web directory, national portal badge, Digital India logo, india.gov.in, NIC logo | Kept, all badges kept | Uniform sizing and even spacing instead of a crowded row — same seven marks, easier to read |

---

## 7. What "improvement" means here, concretely

Since nothing is removed, every gain has to come from four things, applied consistently everywhere above:

1. **Grouping** — related items sit in the same glass panel with space around them, instead of one continuous wall of content
2. **Typography and spacing** — the two-color, single-type-scale system from the Design System doc, applied to existing text, not new text
3. **Softened visual weight** — glass surfaces and gentle shadows instead of solid maroon blocks and hard borders, so nothing *looks* louder than it needs to be, even though it's all still there
4. **Consistency** — the three "View Status" paths, the various dropdowns, and the informational notices all get the same visual language, so the site feels like one coherent product instead of a series of bolted-on additions (which is closer to how the current site actually reads)

---

## 8. What this means for the write-up / demo

This is a strong, honest thing to say to judges directly: *"We recreated the real CPGRAMS site with full feature parity — every link, dropdown, and notice a citizen currently relies on still exists in our version, at the same or fewer clicks away. The redesign is entirely about visual hierarchy and calm presentation, not feature removal — because a live grievance system serving real citizens can't afford to lose functionality in the name of looking cleaner."* That's a more defensible, more mature product stance than a from-scratch reskin, and it directly addresses the brief's warning against solving only the interface — here the interface change is deliberately conservative *because* the underlying process (Sections 5–7 of the product spec: honest expectation-setting, transparent routing, resolution-quality checking) is where the real fix lives.
