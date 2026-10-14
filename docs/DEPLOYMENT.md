# Deployment

The recommended setup is **Vercel** (hosting) + **Supabase** (database and staff sign-in). Both have free tiers that are enough to launch. Any Node.js 20+ host works; see "Other hosts" below.

## 1. Supabase

1. Create a project at supabase.com. Choose the **Mumbai (ap-south-1)** region so customer data stays close to customers.
2. Open **SQL Editor**, paste the contents of `supabase/migrations/0001_threshold_quotes.sql` and run it. (With the Supabase CLI: `supabase link` then `supabase db push`.)
3. Turn off public sign-ups: **Authentication → Sign In / Providers → Email**, disable "Allow new users to sign up". Staff accounts are created by you, not by visitors.
4. Create each staff member: **Authentication → Users → Add user** (email + strong password, "Auto confirm"). Copy the user's UUID.
5. Make them staff, in the SQL Editor:

   ```sql
   insert into public.staff_members (user_id, email, name, role)
   values ('<user uuid>', 'name@yourdomain.in', 'Their Name', 'admin');
   ```

   To remove access later: `update public.staff_members set active = false where email = '…';` — it takes effect on their next request.
6. Recommended: enable MFA for staff (Authentication → Multi-Factor) and set a password policy.
7. From **Settings → API**, note the Project URL, the `anon` public key and the `service_role` key.

## 2. Vercel

1. Import the repository in Vercel (framework preset: Next.js; Node 20+).
2. Add environment variables (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.in` |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**secret**) |
   | `SESSION_SECRET` | output of `openssl rand -base64 48` |
   | `TRUST_PROXY` | `1` |
   | `NEXT_PUBLIC_SHOWROOM_PHONE`, `…_EMAIL`, `…_ADDRESS`, `…_HOURS` | verified details only (optional) |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | e.g. `919876543210` (optional; enables WhatsApp links) |

   `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.
3. Deploy, then add your domain.
4. Add a **rate-limiting rule** in Vercel Firewall for `POST /api/quotes` and `POST /api/admin/session` (e.g. 10 requests per minute per IP). The app's own limiter is per instance and is a backstop, not a replacement.

## 3. Check the deployment

1. Open `/design`, add a door, submit a quote with your own number. You should see a `TH-…` reference.
2. In Supabase **Table Editor → quote_requests**, the row should be there.
3. Sign in at `/admin/login`, open the request, change its status and add a note; reload to confirm both were saved.
4. Temporarily remove `SUPABASE_SERVICE_ROLE_KEY` in a preview deployment and submit: the customer must see "Your request was not sent" — never a confirmation.

## Local development

```bash
npm install
cp .env.example .env.local      # defaults to the local file store
npm run hash-password -- 'a long local passphrase'
# put STAFF_EMAIL and the printed STAFF_PASSWORD_HASH into .env.local
npm run dev
```

Quote requests are written to `.data/quotes.json` (git-ignored). To develop against Supabase instead, set the three `SUPABASE_*` variables (and optionally `QUOTE_STORE=supabase`).

## Quality checks

```bash
npm run typecheck
npm run lint
npm test             # unit + API integration tests (Vitest)
npm run test:e2e     # builds and starts the app, then runs Playwright on desktop and mobile
npm run build
```

`npm run test:e2e` uses its own throwaway file store and staff account. Locally it uses the Chromium at `/opt/pw-browsers/...` if present; set `CHROMIUM_PATH` or run `npx playwright install chromium` elsewhere. CI (`.github/workflows/ci.yml`) runs all of the above on every push.

## Other hosts

- **Any Node host (Railway, Render, a VM):** `npm ci && npm run build && npm start` with the same environment variables. Set `TRUST_PROXY=1` only if a proxy in front sets `X-Forwarded-For`.
- **Single small server without Supabase:** `QUOTE_STORE=file` with `QUOTE_FILE_PATH` on persistent disk, plus `STAFF_EMAIL`/`STAFF_PASSWORD_HASH`. Back the file up. Never use the file store on serverless platforms — their disks are temporary.

## Data and privacy

- Quote requests contain personal data (name, phone, email, locality). Only staff can read them, through the admin API.
- Decide a retention period and delete old requests accordingly (e.g. a scheduled SQL job). Customers can ask to be removed; delete their row (events cascade).
- Visualiser photos never leave the customer's device.
