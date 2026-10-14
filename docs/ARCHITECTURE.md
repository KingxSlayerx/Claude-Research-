# Architecture

## Stack and why

| Choice | Why | Trade-off |
| --- | --- | --- |
| **Next.js 16 (App Router) + TypeScript** | Static marketing and catalogue pages for speed and SEO, interactive client components where needed, and server route handlers for the API in one deployable app. | Next 16 conventions (Cache Components, `proxy.ts`) are new; see `AGENTS.md`. |
| **Tailwind CSS v4** with tokens in `src/app/globals.css` | Design tokens (colour, type scale, easing, shadows) defined once and used everywhere. | Long class lists in some components. |
| **Supabase (Postgres + Auth)** for production | Real relational storage with constraints and transactions; managed staff authentication (password reset, MFA available) without running our own auth server; free tier is enough to launch; data can be exported as plain Postgres. | One external service to configure. Alternatives considered: a hosted form service (no admin workflow), Firebase (document model repeats the original's lost-update problem), self-run Postgres + custom auth (more to operate and secure). |
| **Local JSON file store** for development and tests | Lets the full journey — including admin — run with zero setup and be tested end to end. | Single process only. Refused in production unless `QUOTE_STORE=file` is set explicitly. |
| **Zustand** (persisted) for the customer's draft quote | Small, predictable client state; persisted so customers can come back. | State is per-device by design. |
| **Zod** | One schema validates the form in the browser and the API on the server. | — |

## Layers

```
src/
  domain/          Pure, framework-free business logic (no React, no I/O)
    catalog.ts       Catalogue, rate card, business rules (unchanged values)
    config.ts        DoorConfig type, defaults, change rules, validation of untrusted input
    pricing.ts       priceDoor / startingPrice / quoteTotals
    summary.ts       Text summary and spec rows
    quote.ts         Customer + submission schemas, phone rules, record types
  render/door-svg.ts Door elevation drawing (SVG; dimensioned view, 2D fallback, visualiser overlay)
  render3d/        Real-time 3D door (three.js): construction per style, PBR materials, lit stage
  state/           Client store (draft, quote items, contact form), hydration helpers
  lib/
    quote-client.ts  Browser → API client with typed failure kinds
    visualiser/      On-device photo preparation and the compositor boundary
    server/          Server-only: env, HTTP helpers, rate limiting, auth, quote stores
  components/      UI: site chrome, home sections, catalogue, configurator, quote, visualiser, admin
  app/             Routes
    (site)/          Customer-facing pages with header and footer
    admin/           Staff pages (separate layout, noindex, no customer chrome)
    api/             Route handlers
  proxy.ts         Real 404 status for unknown /doors/<slug>
```

Pricing is computed only in `src/domain/pricing.ts`. The UI calls it for live estimates; the server calls the same function to recompute every price on submission.

## Routes

| Route | Type | Notes |
| --- | --- | --- |
| `/` | Static | Homepage narrative |
| `/doors`, `/doors/[slug]` | Static (9 product pages pre-rendered) | Filters in the URL (`?room=`, `?collection=`) |
| `/design` | Static shell + client | `?style=` starts a design, `?edit=<itemId>` edits a quote line |
| `/visualise` | Static shell + client | `?style=` preselects a design |
| `/quote` | Static shell + client | Review, contact form, submission, confirmation |
| `/admin/login`, `/admin`, `/admin/quotes/[reference]` | Client, session-gated | Separate layout; `noindex`; `Cache-Control: no-store` |
| `POST /api/quotes` | Public | Same-origin check, rate limit, Zod validation, honeypot, idempotency, server-side pricing |
| `GET/POST/DELETE /api/admin/session` | Staff | Sign in / current user / sign out |
| `GET /api/admin/quotes` | Staff | Search, status filter, counts |
| `GET/PATCH /api/admin/quotes/[reference]` | Staff | Detail with history; status change returns the saved record |
| `POST /api/admin/quotes/[reference]/notes` | Staff | Internal follow-up notes |

## Data model (Supabase)

See `supabase/migrations/0001_threshold_quotes.sql`.

- `quote_requests` — one row per request: reference (unique), idempotency key (unique), status, customer fields, `items` (configuration + server-computed price lines per door), `totals`, `pricing_version`. Check constraints on reference, phone format and lengths.
- `quote_events` — append-only history: created, status changes (from → to, by whom), notes.
- `staff_members` — which Supabase Auth users are staff (`active`, `role`).

## Access model

- The **browser never connects to the database.** All reads and writes go through route handlers using the service-role key, which only exists on the server.
- **Row level security is enabled with no policies** and privileges are revoked from `anon`/`authenticated`, so the public anon key cannot read or write anything.
- **Customers** can only create requests. They cannot read any stored request — not even their own — so one customer can never see or alter another's data. Their device keeps a list of references it has sent.
- **Staff** sign in at `/admin/login`. Supabase Auth checks the password; the user must be an active row in `staff_members`. The server then issues its own HMAC-signed, HttpOnly, `SameSite=Strict` session cookie (8 hours). Every admin API call re-verifies the cookie and, in Supabase mode, re-checks that the staff member is still active, so deactivation is immediate.
- **CSRF:** state-changing endpoints require a same-origin `Origin` header; the session cookie is `SameSite=Strict`.
- **Abuse:** per-IP rate limits on submissions (8 per 10 min) and sign-in (per IP and per email); a honeypot field; body size limits. The in-memory limiter protects a single instance — add platform rate limiting in front for multi-instance hosting (see DEPLOYMENT.md).

## 3D rendering

`src/render3d/` builds each door the way it is made — stiles and rails around recessed or raised panels, V-grooves, louvre slats, glazing with beads, frames, architraves and hardware — from the same `DoorConfig` used for pricing, so the 3D view always matches the estimate. Materials are physically based (procedural wood grain, paint, laminate, glass, metals); the stage adds a wall with a real opening, a warm room beyond, a raking key light (with a projected jaali pattern in the hero) and contact shadows.

- **Where it's used:** the scroll-driven homepage hero (the door opens as you scroll), the homepage finish picker, the product page "Turn it around" viewer and the configurator preview (drag to rotate, open/close).
- **Performance:** three.js is loaded on demand only on pages that show a canvas; the stage renders only when something changes (no idle loop); pixel ratio is capped; canvases below the fold initialise when they approach the viewport.
- **Fallbacks:** every 3D view sits on top of a pre-rendered still, so content is visible immediately. Without WebGL (or with reduced motion in the hero) the stills and the 2D drawing remain, fully functional.
- **Pre-rendered imagery:** `npm run renders` renders the hero, product and close-up images from the same engine in headless Chromium (`scripts/renders/`). Re-run it after changing a style or material.

## Visualiser boundary

`src/lib/visualiser/compositor.ts` defines `DoorCompositor`. The current `OverlayCompositor` runs on the device and overlays the door illustration on the photo. A future server-side renderer can implement the same interface; because it would upload photos, it must be opt-in and the privacy copy on `/visualise` must change with it.

## Images

All imagery is referenced through `src/content/assets.ts`, which records each slot's status and shot brief. Today every slot holds a generated placeholder (`npm run placeholders`); see `docs/ASSETS.md`.
