# Sahayak — Design System & Visual Spec

A clean, two-color, uncluttered redesign of the CPGRAMS-style portal. This document is the single source of truth for anyone (or any Codex prompt) building the actual screens.

---

## 1. Design Philosophy

Four rules, in priority order:

1. **One primary action per screen, obvious at a glance.** No competing banners, no rotating carousels, no "everything is important" layout.
2. **Every extra color, border, or badge has to earn its place.** If it's not guiding the user toward completing their task, it's clutter — including well-intentioned trust badges and award logos.
3. **The AI is a feature you opt into, not a wall you walk through.** It should never occupy hero space or block the manual path.
4. **Depth and softness replace flat boxes.** The interface should feel calm and tactile — frosted glass surfaces, soft blur, gentle motion — rather than sharp-edged government-form starkness. "Clean" and "cluttered" are about information density and hierarchy, not about the surfaces being visually flat; a glass, layered interface can still be extremely uncluttered if the hierarchy rules above are followed.

---

## 2. Color System — exactly two colors

Only two brand colors are used anywhere in the product. Everything else is neutral grayscale + white, which doesn't count against the limit because it's structural, not decorative.

| Role | Color | Hex | Usage |
|---|---|---|---|
| **Primary** | Deep Indigo | `#1B2A4A` | Navigation bar, primary buttons, headings, active states, icons |
| **Accent** | Warm Amber | `#E8A33D` | Only for the single most important action on a screen (main CTA), progress indicators, highlights |
| Neutral — Ink | `#1C1C1E` | Body text |
| Neutral — Slate | `#6B7280` | Secondary text, captions, placeholder text |
| Neutral — Border | `#E2E4E8` | Dividers, card borders, input outlines |
| Neutral — Surface | `#F7F8FA` | Page background |
| Neutral — White | `#FFFFFF` | Cards, primary surfaces |

**Hard rule:** Amber is reserved for *one* element per screen — the primary call to action. If a screen has three amber buttons, that's not an accent anymore, that's clutter with a different name. Everything else stays indigo or neutral.

**Status colors (functional only, used sparingly, never decorative):**
- Success: `#2E7D4F` (grievance resolved)
- Pending: Slate `#6B7280` (in progress — deliberately not alarming)
- Attention: `#B3261E` (used only for something needing the user's action, e.g. appeal deadline)

These three are utility colors for status meaning, not part of the brand palette — they appear only as small text/icons next to status labels, never as large fills or banners.

**Glass surface tints — still only two colors, just translucent.** Glassmorphism doesn't add new hues; it adds transparency and blur to the same two colors:

| Surface | Composition | Usage |
|---|---|---|
| Glass Panel (light) | `rgba(255,255,255,0.55)` + `backdrop-blur(20px)` + 1px `rgba(255,255,255,0.4)` border | Cards, tiles, the AI chat panel |
| Glass Panel (indigo-tinted) | `rgba(27,42,74,0.65)` + `backdrop-blur(20px)` | Nav bar, footer — reads as indigo but lets background softly show through |
| Background wash | Soft diagonal gradient, `#F7F8FA → #EAF0FB` | Page background — subtle, never busy, gives the glass panels something gentle to sit on top of |

Amber is still reserved for exactly one primary action per screen — glass treatment doesn't loosen that rule, it just changes how the *supporting* surfaces look.

---

## 3. Typography

One typeface family, one accent weight. No mixing fonts.

- **Font:** Inter (or Noto Sans for full Indian-script support — required given multilingual scope) — a clean, humanist sans-serif that reads well at small sizes on low-end phones
- **Scale:**

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | 32px | 700 | Page-level heading, one per screen |
| H2 | 22px | 600 | Section headings |
| Body | 16px | 400 | All standard text |
| Small | 14px | 400 | Captions, helper text, timestamps |
| Button | 16px | 600 | All button labels |

- Line height: 1.5 for body text, 1.2 for headings
- No italics, no underlines except real links, no all-caps except single-word labels like "STATUS"

---

## 4. Layout & Spacing

- **8px base unit.** All spacing (padding, margins, gaps) is a multiple of 8: 8, 16, 24, 32, 48, 64.
- **Mobile-first grid:** single column below 640px, everything stacks vertically in the order of importance
- **Max content width:** 1200px on desktop, centered, generous side margins — never edge-to-edge walls of text
- **One card style, reused everywhere:** the Glass Panel (light) surface from Section 2 — `rgba(255,255,255,0.55)`, `backdrop-blur(20px)`, 16px corner radius (softer than the earlier flat spec — glass reads best with more rounding), 1px translucent white border, and one soft ambient shadow: `0 8px 32px rgba(27,42,74,0.08)`. This replaces the earlier "no drop shadows" flat-design rule — glass surfaces need a very soft shadow to read as elevated glass rather than a smudge.
- **Performance fallback:** `backdrop-filter: blur()` is expensive on low-end Android phones and older browsers, which matters given the brief's mobile/slow-connection audience. Always ship a solid, non-blurred `rgba(255,255,255,0.92)` fallback for devices/browsers without `backdrop-filter` support — same layout, same hierarchy, just without the blur. Never let the glass effect be load-bearing for readability.

---

## 5. Navigation — organized dropdowns, not a flat menu dump

**Correction from an earlier draft of this doc:** the version below no longer merges or removes anything that exists on the live site — including the three separate "View Status" entry points, the standalone "Nodal Authority for Appeal" link, or "Nodal PG Officers." People already rely on those exact paths; removing or merging them risks breaking habits and trust, even if it looks cleaner on paper. See `Sahayak-Site-Recreation-Spec.md` for the full element-by-element parity map — every link, dropdown, and page from the current site is accounted for there. This section only improves *how* the existing structure looks and feels, not what it contains.

**New nav bar — a floating glass bar, not a flat strip:**

`rgba(27,42,74,0.7)` + `backdrop-blur(24px)`, sitting with 16px margin from the top edge rather than pinned flush, 20px corner radius, white text. It should feel like it's hovering above the page, not welded to it.

```
[Home]  [View Status ▾]  [Nodal PG Officers ▾]  [Redress Process ▾]  [Grievance ▾]  [Nodal Authority for Appeal]  [Mobile App]  [Language ▾]           [Sign In]
```

Every dropdown from the current site stays, with the exact same items — the improvement is purely visual and structural clarity, not reduction:

- **View Status ▾** — Grievance Status · Appeal Status *(unchanged from today)*
- **Nodal PG Officers ▾** — Central Government · State Government *(unchanged)*
- **Redress Process ▾** — Redress Process Flow *(unchanged — still a single-item dropdown; kept as-is rather than force-converted to a plain link, since consistency of "this is a dropdown" across the nav bar matters more than saving one click)*
- **Grievance ▾** — Lodge Public Grievance · Lodge Pension Grievance · View Status · Reminder Clarification · Rate Grievance *(all five items kept — yes, "View Status" appears here too, exactly as today; see the parity doc for how this gets visually clarified rather than deleted)*
- **Nodal Authority for Appeal** — stays a direct link, not folded into a menu
- **Mobile App** — stays a direct link
- **Language ▾** — unchanged
- **Sign In** — top right, unchanged position

Each dropdown opens as its own small glass panel (16px-radius, blurred surface matching the cards), with a soft fade+scale-in — not an instant snap, not a flat gray box. Where a dropdown mixes primary and reference items (like Grievance's five entries), a subtle divider line (`rgba(255,255,255,0.15)`) groups them visually — action items first, reference items after — without removing any of them.

---

## 6. Homepage Layout

Every element on the current homepage stays — the carousel, the disclaimer banner, the "About CPGRAMS" text, the "Issues not taken up for redress" list, the DPG/CSC notes, the "What's New" panel, all three CTA cards, and the full footer. Nothing is deleted. The improvement is entirely about **hierarchy, breathing room, and presentation** — giving the important things visual priority without erasing the rest.

Top to bottom, same content as today, restructured:

1. **Nav bar** (glass, per Section 5)
2. **Hero carousel** — kept, including the AI chatbot / voice-tool promotional slide, but shorter (less vertical height) and paired *alongside* the three action tiles rather than forcing a scroll past it first. On mobile, tiles come first and the carousel follows, since a phone can't show both side-by-side.
3. **Three action tiles**, sitting next to or just below the carousel — Register/Login, View Status, Contact Us, matching the current site's three homepage CTAs exactly (not renamed to generic "Lodge/Track/Help" tiles as an earlier draft suggested)
4. **Disclaimer banner** ("Any grievance sent by email will not be entertained...") — kept, restyled as a slim glass strip instead of a heavy solid block, but the full text stays, unshortened, since it's a real notice people need to see
5. **About CPGRAMS** — full text kept, presented in a glass card with generous line-height and spacing instead of a dense paragraph block, so it's easier to read without being removed or truncated
6. **"Issues which are not taken up for redress"** — full list kept exactly (RTI Matters, Court related/Subjudice matters, Religious matters, Government-employee service matters), presented with clear icon bullets and spacing rather than being hidden away
7. **Notes** (DPG escalation info, CSC fee warning) — kept in full, same content, cleaner typography
8. **"What's New"** panel — kept, same dated document links, presented as a clean card list
9. **Footer** — every link, every badge, the social icons, the hosting credit, the visitor counter — all kept; see Section 12 below for how it's decluttered visually without losing anything

The single real change from today: nothing is stacked in one dense, undifferentiated column. Related things are grouped into distinct glass panels with clear spacing between them, so a user's eye can find what they need — but every single piece of information and every link a citizen currently relies on is still there, one page depth or less from where it is today.

---

## 7. The AI Assistant — present, never forced

- A single circular icon, 56px, indigo with a simple white chat glyph, fixed to the bottom-right corner on every screen
- Default state: closed. It never auto-opens, never has a pulsing "look at me" animation, never appears as a homepage banner
- Tapping it opens a slide-up chat panel (not a full-screen takeover) — the page behind stays visible and usable
- Inside the panel: same two-color system, indigo header, white body, amber only on its own single "Send/Confirm" action
- A user completing the manual form never has to see, dismiss, or acknowledge the assistant exists — it simply sits quietly in the corner

---

## 8. Buttons — three types only

| Type | Look | Use |
|---|---|---|
| Primary | Amber fill (`#E8A33D`), subtle inner highlight for a soft glossy feel, white text, gentle shadow `0 4px 14px rgba(232,163,61,0.35)` | The one main action on a screen |
| Secondary | Glass surface (`rgba(255,255,255,0.5)` + blur), indigo text and 1px indigo-tinted border | Any other real action |
| Text link | Indigo text, no border | Navigation, "learn more," low-emphasis actions |

No more than one Primary button visible at a time. Buttons are 12px corner radius (slightly less rounded than cards, so they read as distinctly tappable). On hover/press: scale to 0.98 and shadow softens — a small, comforting bit of "give," never a jarring snap.

---

## 9. Motion & Micro-interactions — the "smooth and comforting" layer

Motion is what turns a glass aesthetic from decorative into *comforting*. Keep it consistent everywhere:

- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) for everything — nothing linear, nothing bouncy/springy (bounce reads as playful/gamey, not calming, which is wrong for a grievance-filing context)
- **Duration:** 200ms for small things (button press, hover), 350ms for panels/dropdowns opening, 450ms for full page/section transitions. Nothing above ~500ms — smooth, not slow.
- **Dropdown/panel open:** fade in + scale from 0.96 → 1, combined with the blur "resolving in," never an instant appear or a slide that overshoots
- **Page transitions:** gentle cross-fade between steps in the Lodge Grievance flow, so moving from step 2 to step 3 feels like one continuous surface, not a jump
- **Loading states:** a soft pulsing glass shimmer on the card shape itself (not a generic spinner) — keeps the calm, glass-first feel even while waiting
- **The AI assistant icon:** on open, the chat panel rises and fades in from the corner (not a hard modal snap), and gently recedes the same way on close — reinforces that it's a lightweight, optional layer, not a mode switch
- **Reduced motion:** respect `prefers-reduced-motion` — fall back to simple opacity fades, no scale/slide, for users who've set that preference. Comforting for most users should never mean uncomfortable for users sensitive to motion.

---

## 10. Forms (Lodge Grievance flow)

- One question group per screen/step, not a long single-page form — reduces overwhelm, matches how the old site's actual data entry already works, just decluttered
- Progress shown as a simple thin indigo bar at the top, not a heavy stepper graphic
- Every input: label above the field (not placeholder-only — placeholder-only text disappears when typing and confuses first-time users), 8px corner radius, `#E2E4E8` border, indigo border on focus
- Errors: small red text below the field, specific ("Mobile number must be 10 digits"), never a red border alone

---

## 11. Status & Track Page

- One merged page: toggle at top — **Grievance | Appeal** — instead of two separate nav paths
- Each result: a simple card with Registration ID, current stage, and a plain-language expected timeframe (this is where the real data.gov.in-driven expectation-setting from the product spec surfaces visually)
- Status shown as text + small colored dot (success/pending/attention colors from Section 2), never a big colored banner

---

## 12. Before → After, in one line

**Before:** dense, undifferentiated stacking of every element with heavy visual weight (bold maroon blocks, thick borders, badge walls) making it hard to tell what matters most.

**After:** the exact same content and every existing link, dropdown, and page — grouped into distinct glass panels with clear spacing, softened visual weight, and smooth motion — so hierarchy comes from *presentation*, not from deleting anything a citizen currently depends on.

### Footer — full parity, decluttered presentation

Every current footer element stays: Facebook/X/YouTube icons, the "designed, developed & hosted by NIC" credit line, Disclaimer/Website Policies/Web Information Manager links, version number, last-updated date, visitor counter, and the full badge row (anniversary badge, Digital India awards, GOI web directory, national portal badge, Digital India logo, india.gov.in, NIC logo). The improvement: these get organized into clear columns with consistent icon sizing and spacing instead of sitting as one unbroken row competing for attention — same items, easier to scan, nothing removed.

---

## 13. Accessibility notes (non-negotiable, not optional polish)

- Text contrast: indigo-on-white and white-on-indigo both exceed WCAG AA (4.5:1) — verify at build time, don't assume
- Minimum tap target: 44×44px for every button/icon, including the AI assistant icon
- All Hindi/regional-language text uses the same type scale — no shrinking translated text to "make it fit"
- The entire manual flow (no AI) must be fully operable with a screen reader and by keyboard alone — this is table stakes for a government-facing product, not a stretch goal
