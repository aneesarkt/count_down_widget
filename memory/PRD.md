# Retirement Countdown Widget — PRD

## Original Problem Statement
"I want to make a widget ..it should have plus and minus button for my remaining number of shifts before retiring which is 1025..it should also show a count down timer of 4 yrs 10 months and 25 days"

## User Choices
- Start: 1025 shifts
- Countdown: live, ticking
- Persistence: MongoDB (single global widget doc)
- Quick edit feature included
- Visual style: dark/sleek (Outfit + JetBrains Mono, copper accent)

## Architecture
- Frontend: React 19 (CRACO) + Tailwind + shadcn/ui + framer-motion + iconoir-react
- Backend: FastAPI + Motor (async MongoDB)
- DB: MongoDB collection `widgets`, single doc id="default"

## Endpoints
- GET  /api/widget       → get/create default widget (shifts=1025, target=now+4y10m25d)
- PUT  /api/widget/shifts → update shifts_remaining
- POST /api/widget/reset → reset to 1025, regenerate target_date

## Implemented (2026-06-06)
- Widget GET/PUT/reset backend endpoints (persisted target_date)
- Big animated shift counter with +/- buttons (framer-motion tap effects)
- Quick Edit shadcn Dialog with validation (non-negative integers)
- Live 6-segment countdown (Y/M/D/H/M/S) ticking every second
- Dark sleek theme with copper accent, JetBrains Mono numerals, textured radial background
- Deployment health check: PASS

## Backlog / Next Action Items
- P1: Hide counter behind a skeleton while initial GET resolves (eliminate the load-race flash)
- P2: Reset-to-1025 button in the UI (currently API-only)
- P2: Progress bar (shifts completed vs remaining out of 1025)
- P2: Per-user persistence (currently single global widget)
- P2: Confetti / celebration when shifts reach 0
