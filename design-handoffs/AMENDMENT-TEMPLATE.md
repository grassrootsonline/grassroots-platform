# Amendment NN — <short title>

> Copy this file into the relevant `design-handoffs/<feature>/` folder as
> `AMENDMENT-NN-<short>.md` (increment NN). Use it for changes to a screen that
> already exists — describe ONLY what changed, not the whole screen.

**Feature:** <feature folder>
**Screen(s) affected:** <e.g. Home feed, Profile header>
**Date:** <YYYY-MM-DD>
**Updated prototype:** <prototypes/NN-….html — re-bundled with this change, if applicable>

## What changed

A short, plain-language list of the visual/behavioral deltas. Reference exact tokens
and the design-system component involved. Example:

- Feed composer trigger: change placeholder copy from "Share what you're building…" to "…".
- Like action: add the spring `scale 1.25→1` on tap (Framer Motion), per architecture §12.2.
- Right rail: hide "Who to follow" below 1024px.

## What did NOT change

Note anything nearby that should be left exactly as-is, so the diff stays scoped.

## Implementation notes (optional)

Any data-layer, Server Action, or seed-data implications. Keep the seed dataset in
sync if the change alters visible content.
