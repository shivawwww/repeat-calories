# Repeat Calories — Project Context for Claude Code

> Read PLAN.md for the full detailed plan. This file is the quick-start brief.

## What this project is

A full-stack food ordering web app for **Repeat Calories**, a cloud kitchen based in Coimbatore.  
Brand: Orange `#E87722` + Green `#2D6A4F` + Cream `#F5EFE7` | Tagline: **Rep. Eat. Repeat.**  
Assets are in `/assets/` — logo PNG, product photos, meal nutrition Excel.

---

## Decisions already confirmed

- **Single Next.js 14 (App Router) + TypeScript project — no Python, no separate backend.**
  Frontend pages + backend logic both live in this one project (Route Handlers act as the API).
  One Vercel deployment for the whole app.
- **Styling/animation:** TailwindCSS + Framer Motion
- **Database:** MongoDB (native Node driver or Mongoose) — 4 collections: `users`, `menu_items`, `carts`, `orders`
- **Auth:** NextAuth.js (Auth.js v5) — Google OAuth + Credentials (bcrypt) provider, JWT session strategy. JWT sent on every request; logged-out/invalid session blocked on all non-public routes and APIs. No roles — just `is_admin: true/false` on user doc.
- **Signup flow:** name/email/mobile only (no password field) → account created `is_active: false` → welcome email sent with system-generated temp password + activation link → user activates (enters temp password + sets real password) → `is_active: true` → session issued → `/menu`. Google sign-ups skip activation entirely (`is_active: true` immediately, since Google verified the email).
- **Forgot password vs. update password are separate flows:** forgot (logged-out, token via emailed link, no old password needed) vs. update (profile page, logged-in, requires current password).
- **Email:** Resend (`lib/email.ts`), sent from `orders@repeatcalories.com`, API key in `RESEND_API_KEY` (`.env.local`). **Switched back to Resend on 2026-08-26** — the domain `repeatcalories.com` is now owned and connected to Vercel, which removes the blocker that had ruled Resend out on 2026-08-25 (it requires a DNS-owned domain to verify before sending from an address at that domain). Domain must be verified in the Resend dashboard (Domains → Add Domain → add the DKIM/SPF DNS records it generates) before sending works. `EMAIL_FROM` drives the visible from-address and is independent of Google sign-in (matching is by Google account ID/email, not app domain — see PLAN.md §16).
- **Push notifications: Firebase Cloud Messaging (FCM), mandatory.** Pattern ported from `D:\Shiva_workspace\git\couples-app` ("Snug") — PWA manifest + service worker (served via `/api/firebase-sw` rewritten to `/firebase-messaging-sw.js`) + a `NotificationGate` component that full-screen blocks the app (except `/login`, `/signup`, `/activate`, `/forgot`, `/reset-password`) until `Notification.permission === "granted"`. Re-checked on every login and tab-focus — this alone covers "new device" with no separate device-tracking needed. Token stored in `users.fcmTokens[]` (array, dedup'd, multi-device). Admin uses the identical mechanism (just `is_admin:true` on a user doc). iOS Safari cannot receive push unless the site is added to the home screen first (Apple platform limit) — hence the PWA requirement. See PLAN.md §17.
- **Timezone: everything captured in `Asia/Kolkata` (Chennai/IST, UTC+5:30)** — all `created_at`/`updated_at`/token-expiry timestamps across every collection, via `lib/datetime.ts`, not raw UTC. See PLAN.md §18.
- **Same-day order cutoffs:** lunch orderable only before 10:00 AM IST, dinner only before 4:00 PM IST — enforced client + server side. See PLAN.md §19.
- **WhatsApp contact button** (static, not the deferred notification feature): floating link to `https://wa.me/919940749456` on customer-facing pages.
- **Database confirmed: MongoDB Atlas (free M0), not Supabase** — free-tier storage is roughly a wash (~500MB either way); Supabase's free-tier auto-pause after 7 days of inactivity was the deciding risk for a live ordering app.
- **Payments:** Razorpay (full flow: create order → modal → verify signature → webhook backup)
- **API response format everywhere:** `{ ErrorCode: "9999"/"9990", status, message, obj }`
- **Location capture:** Mapbox — "use current location" (browser Geolocation API) + map pin picker + reverse geocoding to prefill address/area/pincode, used in the address form
- **Automated meal-reminder push notifications — built 2026-08-26.** Two Vercel Cron jobs (`web/vercel.json`) hit `/api/cron/lunch-reminder` (scheduled `30 3 * * *` UTC) and `/api/cron/dinner-reminder` (scheduled `30 9 * * *` UTC), guarded by a `CRON_SECRET` bearer-token check. **On the Hobby plan, Vercel only guarantees cron timing within the hour** (not the exact minute), so these actually fire sometime in the 8:30–9:29 AM IST window (lunch) and 2:30–3:29 PM IST window (dinner) — always 31-90min before the 10 AM / 4 PM cutoffs, never less, just not pinned to a fixed minute. Upgrading to Pro would make timing exact if that ever matters. (Vercel attaches it automatically to cron-triggered requests). Each broadcasts to every active user with a registered device via `sendMealReminderBroadcast` (`lib/notify.ts`), picking a **different random message per recipient** from a 220-per-meal template bank in `lib/notificationTemplates.ts` — generated by `web/scripts/generate-notification-templates.py` (combinatorial, not hand-written one-by-one; re-run it to expand/refresh). Templates are hardcoded in that TS file, not stored in the DB. Admin panel also has `/admin/notifications` (`app/api/admin/notifications/send/route.ts`) for one-off manual sends — target "all" or a specific user, admin-authored title/body/link, no logging/history kept (explicitly not wanted).
- **WhatsApp order notifications — deferred, not building yet.** Planned for later: silent WhatsApp to admin's number when an order is placed (customer never sees this), and a WhatsApp to the customer from the business number when admin marks an order "confirmed". Provider not chosen yet (leaning Twilio WhatsApp API). Do not build this until explicitly asked.
- **Reference project for auth/logic patterns only (not copy-paste):** `D:\Shiva_workspace\git\emigrater` (Angular + FastAPI + PostgreSQL) — port the JWT/bcrypt logic patterns to TypeScript.

---

## MongoDB Collections (summary)

### `users`
Addresses are **embedded array** inside the user document — no separate collection.
```json
{
  "_id": "uuid", "name": "", "email": "", "mobile": "", "password_hash": "",
  "auth_provider": "credentials", "is_active": false, "is_admin": false,
  "activation_token": null, "activation_token_expires": null,
  "reset_token": null, "reset_token_expires": null,
  "fcmTokens": ["device-token-1"],
  "addresses": [
    { "address_id": "uuid", "label": "Home", "full_address": "", "area": "",
      "city": "Coimbatore", "pincode": "", "landmark": "", "is_default": true,
      "lat": 0.0, "lng": 0.0 }
  ]
}
```

### `menu_items`
```json
{
  "_id": "uuid", "name": "", "description": "", "category": "Meals",
  "price": 0.0, "image_url": "", "is_available": true, "is_featured": false,
  "nutrition": { "protein_g": 0, "carbs_g": 0, "fibre_g": 0, "calories": 0 }
}
```

### `carts` — one document per user, upserted on every change
```json
{
  "_id": "uuid", "user_id": "uuid",
  "items": [{ "menu_item_id": "", "name": "", "price": 0, "quantity": 1, "image_url": "" }],
  "total_amount": 0.0
}
```

### `orders`
```json
{
  "_id": "uuid", "order_number": "RC-2026-0001", "user_id": "uuid",
  "user_snapshot": { "name": "", "mobile": "", "email": "" },
  "delivery_address": { "label": "", "full_address": "", "area": "", "city": "", "pincode": "" },
  "items": [{ "menu_item_id": "", "name": "", "price": 0, "quantity": 1, "subtotal": 0 }],
  "subtotal": 0, "delivery_charge": 40, "total_amount": 0,
  "status": "pending",
  "payment_method": "razorpay",
  "payment_status": "pending",
  "razorpay": { "razorpay_order_id": "", "razorpay_payment_id": "", "razorpay_signature": "" },
  "notes": ""
}
```

Order status flow: `pending → confirmed / payment_failed → preparing → ready → delivered / cancelled`

---

## Key business rules

- Minimum order: ₹199
- Delivery charge: ₹40 (free above ₹499)
- User must have at least 1 saved address before checkout completes
- After signup → activation required (temp password via email) → then straight to `/menu`, no separate login step. Google sign-in → straight to `/menu`, no activation.
- Every user (incl. admin) must grant FCM push permission at signup or on any new device before they can use the app — enforced by `NotificationGate`
- Lunch items orderable only before 10:00 AM IST; dinner items only before 4:00 PM IST (same-day cutoffs)
- After payment confirmed → clear cart → redirect to `/checkout/success`
- Admin panel auto-refreshes orders every 30 seconds
- Order placed → FCM push to admin (live now) + silent WhatsApp alert to admin (deferred feature)
- Admin marks order status → FCM push to customer (live now) + WhatsApp alert on "confirmed" (deferred feature)

---

## Project folder structure to build

```
repeat-calories/
└── web/                      ← single Next.js 14 project (frontend + backend)
    ├── app/
    │   ├── (public)/          landing, login, signup, forgot
    │   ├── (user)/            menu, cart, checkout, orders, profile/addresses
    │   ├── (admin)/           dashboard, orders, users, analytics
    │   └── api/               Route Handlers = the backend
    │       ├── auth/          [...nextauth] (Google+Credentials), signup, activate,
    │       │                  resend-activation, forgotpassword, reset-password, updatepassword
    │       ├── address/       add, update, remove, setdefault
    │       ├── menu/          getall, getbycategory, featured
    │       ├── cart/          get, add, updateqty, remove, clear
    │       ├── orders/        create-razorpay, verify-payment, mark-failed, mine
    │       ├── admin/         users, orders, analytics
    │       ├── webhook/       razorpay webhook handler
    │       ├── notifications/token/  save/remove this device's FCM token
    │       └── firebase-sw/   serves FCM service worker JS
    ├── lib/
    │   ├── db.ts              MongoDB client singleton
    │   ├── auth.ts            NextAuth config (Google + Credentials, JWT session)
    │   ├── password.ts        bcrypt helpers, temp-password + token generation
    │   ├── email.ts           Nodemailer (Gmail SMTP) — welcome/activation + reset emails
    │   ├── razorpay.ts        Razorpay client + signature verify
    │   ├── mapbox.ts           Mapbox geocoding helper
    │   ├── firebase-client.ts registerForNotifications, saveNotificationToken
    │   ├── firebase-admin.ts  server-side Admin SDK, sendPush()
    │   ├── datetime.ts        Asia/Kolkata timestamp helpers
    │   └── api.ts             fetch wrapper used by client components
    ├── components/
    │   └── NotificationGate.tsx  mandatory push-permission gate
    ├── public/manifest.json   PWA manifest (required for iOS push)
    ├── types/models.ts        ← single source of truth for all interfaces
    ├── hooks/
    ├── middleware.ts          route protection (user + admin guards)
    └── .env.local
```

---

## Where to start next

**Start Phase 1 — Backend (as Next.js Route Handlers).**  
Run these commands to scaffold:
```bash
npx create-next-app@latest web --typescript --tailwind --app
cd web
npm install mongodb bcryptjs jsonwebtoken razorpay mapbox-gl framer-motion
npm install -D @types/bcryptjs @types/jsonwebtoken
npm install next-auth firebase firebase-admin nodemailer dayjs
npm install -D @types/nodemailer
```

Then build modules in this order:
1. `lib/db.ts` — MongoDB client singleton (cached across hot reloads)
2. `.env.local` — config values
3. `lib/auth.ts` — NextAuth config (Google + Credentials providers, JWT session)
4. `lib/password.ts` — bcrypt helpers, temp-password + token generation
5. `lib/email.ts` — Resend, welcome/activation + reset templates
6. `app/api/auth/` — `[...nextauth]`, signup, activate, resend-activation, forgotpassword, reset-password, updatepassword
7. `lib/datetime.ts` — Asia/Kolkata timestamp helpers, used for every write from here on
8. `app/api/address/` — add, update, remove, set_default (all update user doc)
9. `app/api/menu/` — getall, getbycategory, featured (admin: add, update, toggle)
10. `app/api/cart/` — get, add, updateqty, remove, clear
11. `app/api/orders/` — create-razorpay, verify-payment, mark-failed, mine (enforce lunch/dinner cutoffs)
12. `app/api/webhook/razorpay/` — signature verify + update order status
13. `app/api/admin/` — users, orders by status, update status, analytics aggregation
14. `lib/firebase-admin.ts` + `app/api/notifications/token/` + `app/api/firebase-sw/` — FCM send/store/service-worker (see PLAN.md §17, ported from `couples-app`)
15. `middleware.ts` — route protection (session required on all non-public routes/APIs)

Tell Claude: "Start Phase 1, build the Next.js backend (Route Handlers) for Repeat Calories" and share this file path.

---

## .env.local values needed

```
MONGO_URL=mongodb+srv://...
DB_NAME=repeat_calories
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
JWT_EXPIRY_HOURS=72
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=orders@repeatcalories.com
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
ADMIN_EMAIL=admin@repeatcalories.com
ADMIN_PASSWORD=
CRON_SECRET=
DELIVERY_CHARGE=40
FREE_DELIVERY_ABOVE=499
MIN_ORDER_AMOUNT=199
```

---

## Reference: emigrater auth pattern (logic reference only — port to TypeScript, don't copy Python)

The emigrater project at `D:\Shiva_workspace\git\emigrater` has working FastAPI auth code to reference for logic/flow.  
Key files:
- `api/app/user/controller.py` — login, signup logic (bcrypt, JWT) — port this flow to TS
- `api/app/user/schema.py` — Pydantic schemas — port to TS types/zod
- `web/src/app/_services/auth.service.ts` — HTTP service pattern
- `web/src/app/_services/auth.guard.ts` — route guard pattern
