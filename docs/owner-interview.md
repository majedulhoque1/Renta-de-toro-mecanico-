# Filix — owner interview (Phase 0)

Purpose: map how Filix actually runs an event today, end to end, so Filix OS automates real friction instead of imagined friction. Also collects the specific values the site and OS need before launch. Run this as a conversation, not a form — the workflow map matters more than the checklist.

## Part A — the workflow map
Walk through the full lifecycle of a real recent booking, step by step. For each step, ask "how does this actually happen today?" and note it verbatim.

1. **First contact** — FB message? Phone call? Referral? What do you say back, roughly?
2. **Conversation** — What do you ask the customer? What do they usually ask you?
3. **Quote** — How do you decide the price? Do you send it in writing or just say it?
4. **Deposit** — Do you require one today? How much? How do they pay it?
5. **Scheduling** — Where do you track the date (phone calendar? notebook? nothing)?
6. **Preparation** — What do you personally check/pack before an event?
7. **Travel** — How far do you typically go? Any max radius?
8. **Setup** — How long does setup take? What do you need on-site (power, space, surface)?
9. **The event** — Do you operate it yourself, or do you have staff?
10. **Breakdown** — How long, anything that goes wrong often?
11. **Payment** — When/how is the balance collected?
12. **Review/repeat** — Do you ever ask for reviews or follow up for repeat bookings today?

**For each step, flag:** "Where are you doing this from memory / a notebook / texts, that the system should just remember for you?" Those become the P1 automation backlog.

## Part B — blocking values (needed before the site can go live)
| Question | Answer |
|---|---|
| Confirm the public brand name (currently placeholder "Filix") | |
| Starting price — cumpleaños (birthday) | |
| Starting price — quinceañera | |
| Starting price — bautizo (baptism) | |
| Starting price — boda (wedding) | |
| Starting price — corporativo | |
| Starting price — bar/nightlife | |
| Starting price — festival | |
| Starting price — universidad (college) | |
| Deposit — percentage or flat amount? | |
| Payment methods accepted (cash / Zelle / Venmo / card / other) | |
| Service radius from Sacramento (miles or city list) | |
| Owner email for lead/priority notifications | |
| Owner phone for SMS alerts (or "email only") | |
| Number of staff besides the owner | |
| Insurance: do you currently carry it? Carrier/limits if yes | |
| Anything missing from the default checklist? (see below) | |
| Preferred OS language: English, Spanish, or both? | |

## Default checklist seeded in the system (confirm or edit)
**Before:** Confirm location · Confirm access · Confirm power · Confirm space · Confirm insurance requirements · Confirm payment · Assign staff · Equipment check
**Event day:** Load equipment · Transport · Setup · Safety check · Event operation · Breakdown · Return equipment
**After:** Payment complete · Photos uploaded · Review requested · Social content created · Customer follow-up

## Assets to collect
- Original files (not FB-compressed) of all reels/photos already posted
- Any new phone footage possible: a full ride start-to-finish, crowd reaction/laughing, someone falling off, setup process, a night event, a daytime family event
- At least one vertical (9:16) clip for mobile hero use

## What this unlocks
Part B's answers fill the `site_settings` table directly (`price_*`, `notify_owner_*`, `deposit_percent`, `brand_name`) — no code changes needed, just a Settings-screen edit or a SQL update. The workflow map in Part A tunes the checklist template and shapes which P1 automations (day-2/5/10 follow-ups, review requests) matter most to build first.
