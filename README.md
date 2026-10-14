# Threshold — doors & interiors, Hyderabad

The website, door configurator, quote journey and showroom inbox for Threshold. It replaces the original single-file `Threshold Door Studio.html` (kept in `legacy/` for reference) with a maintainable Next.js application.

## What's here

- **Homepage** — a scroll-driven 3D hero in which the door swings open, a live finish picker on a real-time 3D door, collections, close-ups of materials and hardware, the visualiser, the measure-make-fit process and a closing call to action.
- **Catalogue** (`/doors`) — the nine original designs, filterable by room and collection, each with a product page showing its standard specification and what the starting price includes.
- **Configurator** (`/design`) — a live 3D preview you can rotate and open, plus a dimensioned drawing, with every option from the original (size, core, thickness, finish, colour, glass, handle, hardware finish, lock, frame, architrave, hinges, handing, installation, quantity) and an itemised estimate.
- **Visualiser** (`/visualise`) — place your design on a photo of your doorway or a sample room. Photos never leave the device.
- **Quote** (`/quote`) — multi-door quote with edit / duplicate / remove, GST, a validated contact form and a confirmed reference number.
- **Showroom inbox** (`/admin`) — staff sign-in, search, status filters, request detail, call / WhatsApp / email actions, status changes and notes with full history.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run hash-password -- 'a long local passphrase'   # paste into STAFF_PASSWORD_HASH, set STAFF_EMAIL
npm run dev
```

Open http://localhost:3000. Staff sign in at http://localhost:3000/admin/login. In development, quote requests are stored in `.data/quotes.json`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm test` | Unit and API integration tests (pricing parity with the original, rules, validation, auth, storage) |
| `npm run test:e2e` | Playwright journeys on desktop and mobile (2D fallback), live 3D checks, and axe accessibility scans |
| `npm run renders` | Re-render hero, product and close-up imagery from the 3D engine |
| `npm run placeholders` | Regenerate the visualiser sample-room illustrations |
| `npm run assets:check` | List image slots still awaiting real photography |
| `npm run hash-password -- '<pw>'` | Hash for the file-store staff account |

## Documentation

- [docs/AUDIT.md](docs/AUDIT.md) — what the original did, bugs and security issues found, how each was resolved
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack choices and trade-offs, layers, routes, data and access model
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Supabase + Vercel setup, environment variables, checks
- [docs/PRICING-REVIEW.md](docs/PRICING-REVIEW.md) — pricing assumptions and copy that need business approval
- [docs/ASSETS.md](docs/ASSETS.md) — photography shot list and how to replace placeholders

## Before launch

1. Approve or correct the items in `docs/PRICING-REVIEW.md`.
2. Replace placeholder imagery (`npm run assets:check`).
3. Set verified contact details and the WhatsApp number (`.env.example`).
4. Complete the Supabase and Vercel setup in `docs/DEPLOYMENT.md` and run its checklist.
