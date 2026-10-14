# Audit of the original `Threshold Door Studio.html`

The original site (kept unchanged in `legacy/`) is a single 758-line HTML file: inline CSS, an inline script, and five "tabs" toggled by JavaScript. This document records what it did, what was preserved, and the problems found.

## 1. Functionality map

| Area | Original behaviour | Where it lives now |
| --- | --- | --- |
| Catalogue | 9 styles (Flush, Shaker, Four-Panel, Grooved, Glass Strip, Louvred, Carved Main, Pivot Entrance, Sliding Barn) with blurb, rooms, rate per sq ft and default specification | `src/domain/catalog.ts` (`STYLES`) — values unchanged |
| Room filter | All / Main entrance / Bedroom / Bathroom / Kitchen & utility / Balcony & patio | `/doors` room filter (URL `?room=`), plus a new collection filter |
| "From" price | `price(defaultCfg(style)).unit` | `startingPrice()` in `src/domain/pricing.ts` |
| Configurator | Room, style, size presets, width 600–1500 mm, height 1800–3000 mm (rounded to 10 mm), thickness, core, finish, colour, glass (Glass Strip only), handle, hardware finish, lock, frame, architrave, hinges, handing, opening direction, installation, quantity | `/design` — same options and rules (`applyChange`, `clampDimension`) |
| Style switch rule | Resets to the new style's defaults, keeps quantity and handing, keeps room if suitable | `applyChange({ key: "style" })` |
| Advice | Bathroom → suggest WPC; entrance → suggest ≥40 mm and mortise/smart lock | `adviceFor()` |
| Pricing | Shutter = rate × area × core × finish × thickness (rounded to ₹10); glass; handle (+1.9× for Pivot pull) + hardware finish; lock; pivot/track kit *or* hinges; frame; architrave; installation; GST 18% on subtotal | `priceDoor()` / `quoteTotals()` — proven identical by `tests/unit/pricing-parity.test.ts` |
| Drawing | SVG door per style, drawn in mm with optional dimension lines | `src/render/door-svg.ts` (same geometry, upgraded materials) |
| Visualiser | Upload photo (FileReader data URL), drag door with pointer, size slider, sample wall, pick current design or a quote item | `/visualise` — kept and extended |
| Quote | Multi-line quote, edit / duplicate / remove, per-line quantity, subtotal + GST + total | `/quote` |
| Contact form | Name, mobile (Indian 10-digit rule), email, locality, project type, timeline, site measurement, notes | `/quote` form — same fields and phone rule, plus consent |
| Submission | Saved to `quotes/<userId>` document via an optional `window.claude` cloud API, else to `localStorage` with a "send it on WhatsApp" message | `POST /api/quotes` → Supabase (production) |
| Customer history | List of the customer's own requests with live status | "Requests sent from this device" (reference, date, total) |
| Showroom inbox | Hidden tab shown when `USER.canEdit()`; status dropdown per request | `/admin` with sign-in, search, filters, detail view, notes and audit history |
| Persistence | `localStorage` keys `th.cfg`, `th.quote`, `th.form`, `th.mine` | `threshold.v1` (validated on load); the old keys are imported once so in-progress quotes are not lost |

## 2. Bugs and incomplete behaviour found

1. **Silent data loss in the cloud store.** Each customer's requests were stored as an array in one document and trimmed with `.slice(-25)`; older requests disappeared without warning.
2. **Lost updates.** Both submission and status changes did read-modify-write on the whole document. A customer submitting while staff changed a status could overwrite one or the other.
3. **"Success" without delivery.** When cloud storage was unavailable the request was saved only in the customer's browser. The UI said "Saved on this device", but the showroom never received it.
4. **Weak references.** `TH-YYMMDD-` plus 4 random base-36 characters from `Math.random()`, generated on the client, with no uniqueness check. Dates used the device's local time.
5. **Prices trusted from the client.** Stored totals came from the browser; nothing recomputed them.
6. **Focus loss.** Every option click rebuilt the whole configurator with `innerHTML`, moving keyboard and screen-reader focus to the top of the page.
7. **No URLs.** Tabs were buttons, so the back button, sharing and search indexing did not work.
8. **Visualiser.** Full-resolution photos were held as data URLs (slow with phone photos), no file-type or size check, no error handling, no keyboard or pinch support, and the door could not be resized by direct manipulation.
9. **Invalid email accepted.** Email was not validated.
10. **Copy fallback.** Clipboard fallback selected text but told desktop users only "Press Ctrl/Cmd + C".
11. **Markup.** `<title>` inside `<body>`, `charset=utf8`, a placeholder phone number `+91 90000 00000` shown to customers as the WhatsApp contact.

## 3. Security risks found

1. **Stored XSS in the showroom inbox.** Customers wrote their own request objects. `ref`, `_doc`, `status` and quantities were interpolated into the inbox HTML without escaping, so a crafted request could run script in a staff member's browser.
2. **Inbox crash on bad data.** An unknown `style` in a stored request made `STY(...).name` throw, breaking the whole inbox.
3. **Customers could change their own status** (e.g. mark a request "won") because they owned the document.
4. **Access control by hidden tab.** The inbox was hidden in the UI; authorisation depended entirely on the hosting platform's `canEdit()`.

## 4. How each issue is resolved

| Issue | Resolution |
| --- | --- |
| Data loss, lost updates | One row per request in Postgres; status changes and their audit event in one transaction (`set_quote_status`). |
| False success | The confirmation only appears after the server returns a stored reference. Unconfigured storage returns `503`; the UI says the request was **not** sent and keeps the quote. |
| References | Server-generated `TH-YYMMDD-XXXXX` (IST date, 32-symbol unambiguous alphabet, `crypto.randomInt`), unique constraint with retry. |
| Client prices | `buildQuote()` re-validates every configuration and recomputes every price on the server. |
| Duplicate submissions | Idempotency key per payload; retries return the original reference. |
| XSS | React escapes all output; inputs are validated with Zod; the DB has check constraints; staff UI never uses raw HTML for customer data. |
| Access control | Staff session cookie (HMAC-signed, HttpOnly, SameSite=Strict, 8 h); every admin API checks it; Supabase membership is re-checked per request; RLS denies all public access. |
| Focus loss, URLs | React components with native radio groups; real routes for every view. |
| Visualiser | On-device decode + downscale to 2400 px, type/size checks, HEIC message, drag, pinch, corner resize, keyboard, sample rooms at true scale, image export. |
