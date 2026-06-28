# Amendment 01 — Landing page copy & hero stats

**Feature:** core-social-mvp
**Screen(s) affected:** Landing page (`prototypes/01-landing.html`) — header, hero, value props, footer
**Date:** 2026-06-27
**Updated prototype:** `prototypes/01-landing.html` (re-bundled with these changes)
**Source of changes:** teammate review (Alex)

## What changed

Copy and one structural swap on the landing page. All values still come from the Grassroots design system — no new tokens.

- **Hero eyebrow:** "A home for builders" → **"A home for creators"**.
- **Header anchoring:** wordmark anchored hard-left, auth button group (`Log in` + `Sign up`) anchored hard-right. (Implemented with `justify-content: space-between` on the 1040px header container — already in place; called out so it's preserved.)
- **Hero paragraph:** → **"Grassroots sits at the center of social enterprise in AI. Share what you're working on, connect with likeminded individuals, dream big."**
- **Hero subtext** (under the CTAs): "Free to join · No feeds full of noise" → **"Free to join. No ads."**
- **Hero right column — replaced entirely.** The faux "Your feed" preview card (with sample `FeedCard`s) is gone. In its place: a **live stats card** titled "Live on Grassroots" (sage live-dot) showing three counters, each a DM Serif Display number + label + sage Tabler icon:
  - **1,284 — Users online** (`ti-user`)
  - **312 — Active communities** (`ti-users-group`)
  - **4,927 — Ongoing threads** (`ti-message-circle`)
  - *Production:* these are placeholder figures. Wire to real platform metrics (e.g. presence count, `communities` count, open `posts`/threads). On `main` these read live; on seeded branches they read from the seed dataset. Numbers should format with thousands separators.
- **Value props (the three cards) — retitled/rewritten:**
  - Card 1: title **"Build openly"**, body **"What you shipped, what you broke, what you learned, and what you imagine. Your journey, in one place."** (icon `ti-pencil`)
  - Card 2: title **"Build together"**, body **"Create communities that follow the development of group projects and products. Talking to your audience has never been easier."** (icon changed to `ti-users-group`)
  - Card 3: unchanged — "Join the conversation" (`ti-message-circle`).
- **Footer nav:** "About" → **"Careers"**; "Communities" → **"Terms of service"**. Final order: Careers · Terms of service · Guidelines · Privacy.

## What did NOT change

- The hero H1 ("Share what you're building."), the CTA buttons, the closing CTA band, the auth modal, and the toast are all unchanged.
- Layout, spacing, type scale, and the warm-neutral + sage palette are untouched.

## Implementation notes

- The stats card is the only behavioral addition — treat the three figures as data, not hard-coded copy (see above). Everything else is text/label changes.
- Keep the seed dataset's stat values in sync with this prototype so seeded previews match the design.
