# Repeat Calories — Full Web App Build Plan (v2)

> Cloud kitchen launching Thursday, Coimbatore  
> Brand: Orange `#E87722` + Green `#2D6A4F` + Cream `#F5EFE7` | Tagline: **Rep. Eat. Repeat.**

---

## FRAMEWORK DECISION — Angular vs React vs Next.js

| | Angular 18 | React (Vite) | Next.js 14+ |
|---|---|---|---|
| Code reuse from emigrater | Direct copy of guards, services, validators | Rewrite everything | Rewrite everything |
| Landing page SEO | No SSR by default | No SSR | Built-in SSR — Google indexes immediately |
| Animation libraries | Limited | Framer Motion, GSAP (best ecosystem) | Same as React — Framer Motion, GSAP |
| Mobile-first food app feel | Workable | Great | **Best** — Swiggy/Zomato-grade UI possible |
| Razorpay integration | Works | Works | Works + server actions simplify webhook |
| Bundle size | Heavy | Light | Optimized per-page |
| Image optimization | Manual | Manual | **Built-in `next/image`** — critical for food photos |
| Deployment | Nginx/VPS | Nginx/VPS | **Vercel (zero-config)** or VPS |
| API server needed | Yes (FastAPI) | Yes (FastAPI) | Optional — can use Route Handlers instead |
| Speed to build | Fastest (copy from emigrater) | Medium | Medium |

### DECISION: **Next.js 14 only — no Python backend**

Reason: You are building a consumer-facing food ordering app that will be primarily used on mobile browsers. Next.js gives you:
- SSR on landing page so it appears on Google the moment you launch
- `next/image` automatically compresses and lazy-loads your food photos (critical for mobile data speeds)
- Framer Motion for premium hero animations (the food industry standard)
- API Route Handlers to handle Razorpay webhooks *and* all backend logic in the same project — no separate server
- **Single Vercel deployment** — one project, one build, no second host to manage or pay for

FastAPI is **not used**. All backend logic (auth, cart, orders, admin, webhook) is implemented as Next.js Route Handlers using the native MongoDB Node driver, `bcryptjs`, and `jsonwebtoken`. The `emigrater` FastAPI code remains a logic/flow reference only — its auth and JWT patterns are ported to TypeScript, not copy-pasted.

---

## 1. Tech Stack (Updated)

| Layer | Tech |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) + TypeScript — single project, Route Handlers are the API |
| Styling | TailwindCSS |
| Animations | Framer Motion (hero) + CSS transitions |
| Database | MongoDB — native Node driver (or Mongoose) |
| Auth | **NextAuth.js (Auth.js v5)** — Google OAuth provider + Credentials provider (bcrypt), JWT session strategy. Session JWT sent on every request; logged-out/invalid token blocked everywhere except public routes. |
| Email | **Resend** — welcome/activation email, forgot-password reset email. Sent from `repeatcalories@gmail.com` (no domain yet; see §16). |
| Payments | Razorpay (order creation + webhook verification) |
| Location | Mapbox — current-location geolocation + map pin picker + reverse geocoding |
| Images | next/image + /public/meals/ folder or Cloudinary |
| Deployment | Vercel — **single project**, no separate backend host |
| Push notifications | **Firebase Cloud Messaging (FCM)** — mandatory at signup/new device, pattern reused from `couples-app` ("Snug"). See §17. |
| PWA | Web app manifest + installable "Add to Home Screen" — required for iOS push to work at all |
| Notifications (deferred) | WhatsApp — order-placed alert to admin, order-confirmed alert to customer. Provider not chosen; not built yet. FCM covers push for launch; WhatsApp is an additional channel later, not a replacement. |

---

## 2. MongoDB Schema — 4 Collections (Updated)

### 2.1 `users` — addresses embedded inside user document

```json
{
  "_id": "uuid-string",
  "name": "Shiva Kumar",
  "email": "shiva@gmail.com",
  "mobile": "9876543210",
  "password_hash": "bcrypt_hash",
  "auth_provider": "credentials",
  "is_active": false,
  "is_admin": false,
  "activation_token": "hashed-token-or-null",
  "activation_token_expires": "2026-08-29T10:00:00Z",
  "reset_token": null,
  "reset_token_expires": null,
  "fcmTokens": ["device-token-1", "device-token-2"],
  "addresses": [
    {
      "address_id": "addr-uuid-1",
      "label": "Home",
      "full_address": "42, Gandhi Street, RS Puram",
      "area": "RS Puram",
      "city": "Coimbatore",
      "pincode": "641002",
      "landmark": "Near Big Bazaar",
      "is_default": true,
      "lat": 11.0018,
      "lng": 76.9629
    },
    {
      "address_id": "addr-uuid-2",
      "label": "Work",
      "full_address": "12, Avinashi Road, Peelamedu",
      "area": "Peelamedu",
      "city": "Coimbatore",
      "pincode": "641004",
      "landmark": "IT Park Gate",
      "is_default": false
    }
  ],
  "created_at": "2026-08-28T10:00:00Z",
  "updated_at": "2026-08-28T10:00:00Z"
}
```

> Addresses embedded in user — no join needed. Max practical addresses per user is ~5 so no performance concern.
> `lat`/`lng` are captured via Mapbox (current-location button or map pin drop) and reverse-geocoded to prefill `full_address`/`area`/`pincode`.
> `auth_provider: "credentials" | "google"`. Google sign-ups get `is_active: true` immediately (Google already verified the email) and skip the activation flow entirely — `password_hash` is unused/null for them.
> Credentials sign-ups start `is_active: false` with a system-generated temp password; `activation_token` clears once activated. `reset_token` is only ever set during a forgot-password request and clears after use.
> `fcmTokens` — one entry per device/browser this user has granted push permission on (array, deduped). Populated by the mandatory notification gate (§17). Admin users use the exact same field/mechanism — no separate admin-notification schema.
> **All timestamps in every collection (`created_at`, `updated_at`, token expiries, `order_number` date component, etc.) are captured in `Asia/Kolkata` (Chennai/IST, UTC+5:30) — see §18.**

### 2.2 `menu_items`

```json
{
  "_id": "uuid-string",
  "name": "Grilled Chicken Bowl",
  "description": "High-protein grilled chicken with brown rice and steamed veggies",
  "category": "Meals",
  "price": 299.00,
  "image_url": "/meals/chicken-bowl.jpg",
  "nutrition": {
    "protein_g": 42,
    "carbs_g": 35,
    "fibre_g": 8,
    "calories": 480
  },
  "is_available": true,
  "is_featured": true,
  "sort_order": 1,
  "created_at": "2026-08-28T10:00:00Z"
}
```

### 2.3 `carts` — one document per user, upserted on every change

```json
{
  "_id": "uuid-string",
  "user_id": "user-uuid",
  "items": [
    {
      "menu_item_id": "menu-uuid",
      "name": "Grilled Chicken Bowl",
      "price": 299.00,
      "quantity": 2,
      "image_url": "/meals/chicken-bowl.jpg"
    }
  ],
  "total_amount": 598.00,
  "updated_at": "2026-08-28T10:00:00Z"
}
```

### 2.4 `orders` — full Razorpay + status tracking

```json
{
  "_id": "uuid-string",
  "order_number": "RC-2026-0001",
  "user_id": "user-uuid",
  "user_snapshot": {
    "name": "Shiva Kumar",
    "mobile": "9876543210",
    "email": "shiva@gmail.com"
  },
  "delivery_address": {
    "label": "Home",
    "full_address": "42, Gandhi Street, RS Puram",
    "area": "RS Puram",
    "city": "Coimbatore",
    "pincode": "641002",
    "landmark": "Near Big Bazaar"
  },
  "items": [
    {
      "menu_item_id": "menu-uuid",
      "name": "Grilled Chicken Bowl",
      "price": 299.00,
      "quantity": 2,
      "subtotal": 598.00
    }
  ],
  "subtotal": 598.00,
  "delivery_charge": 40.00,
  "total_amount": 638.00,
  "status": "confirmed",
  "payment_method": "razorpay",
  "payment_status": "paid",
  "razorpay": {
    "razorpay_order_id": "order_XXXXXXXXXXXX",
    "razorpay_payment_id": "pay_XXXXXXXXXXXX",
    "razorpay_signature": "verified_signature_hash",
    "payment_captured_at": "2026-08-28T10:05:00Z"
  },
  "notes": "Extra spicy please",
  "created_at": "2026-08-28T10:00:00Z",
  "updated_at": "2026-08-28T10:05:00Z"
}
```

---

## 3. Order Status Flow (Updated)

```
User places order
       │
       ▼
  [payment_method = razorpay]          [payment_method = cod]
       │                                        │
       ▼                                        ▼
  Status: "pending"                    Status: "confirmed"
  Payment: "pending"                   Payment: "pending"
       │
  Razorpay checkout opens
       │
  ┌────┴────┐
  │         │
SUCCESS   FAILURE
  │         │
  ▼         ▼
"confirmed"  "payment_failed"
"paid"       "failed"
  │
  ▼
Admin sees it → moves to "preparing"
  │
  ▼
"ready"
  │
  ▼
"delivered"
```

**Status values:** `pending | confirmed | payment_failed | preparing | ready | delivered | cancelled`  
**Payment status values:** `pending | paid | failed | refunded`

---

## 4. Razorpay Integration Flow

```
Frontend (Next.js client)          Backend (Next.js Route Handler)  Razorpay
─────────────────                  ──────────────────────────────  ────────
User clicks "Pay Now"
      │
      ▼
POST /api/orders/create-razorpay ─► Create Razorpay order        
      │                             using razorpay API key        
      │                             Save order doc with           
      │                             status="pending"              
      │                        ◄──── Return { razorpay_order_id,  
      │                               amount, currency, key_id }  
      │
      ▼
Load Razorpay checkout widget
(rzp.open())
      │
  ┌───┴───┐
  │       │
SUCCESS  FAILURE
  │       │
  ▼       ▼
POST /api/orders/verify-payment PATCH /api/orders/mark-failed
(razorpay_order_id,             (order_id)
 razorpay_payment_id,               │
 razorpay_signature)               ▼
      │                       status="payment_failed"
      ▼                       → Show failure screen
Backend verifies
HMAC-SHA256 signature
      │
  ┌───┴───┐
VALID    INVALID
  │         │
  ▼         ▼
status=     status="payment_failed"
"confirmed"
payment_status="paid"
      │
      ▼
Clear cart → Return order_number
      │
      ▼
Redirect → /orders/RC-2026-0001
(order confirmation screen)
```

**Razorpay Webhook** (backup, for cases where user closes browser mid-payment):
```
Razorpay → POST /api/webhook/razorpay
Route Handler verifies X-Razorpay-Signature header
Updates order status if payment.captured event received
```

---

## 5. Shared API Response Format

```json
{ "ErrorCode": "9999", "status": "success", "message": "...", "obj": {} }
{ "ErrorCode": "9990", "status": "fail",    "message": "...", "obj": null }
```

---

## 6. Project Structure — Single Next.js 14 App (frontend + backend)

No Python, no separate API server. `app/api/**/route.ts` Route Handlers *are* the backend, deployed as one Vercel project.

```
web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page (SSR)
│   │   ├── login/page.tsx        # email/password + "Sign in with Google" button
│   │   ├── signup/page.tsx       # name/email/mobile only — no password field
│   │   ├── activate/page.tsx     # ?token=... → enter temp password + set new password
│   │   ├── forgot/page.tsx       # request reset email
│   │   └── reset-password/page.tsx  # ?token=... → set new password
│   ├── (user)/
│   │   ├── layout.tsx            # User layout — top nav + cart badge + bottom nav (mobile)
│   │   ├── menu/page.tsx         # Browse menu
│   │   ├── cart/page.tsx         # Cart + address selection + checkout
│   │   ├── checkout/
│   │   │   ├── page.tsx          # Address confirm + Razorpay trigger
│   │   │   ├── success/page.tsx  # Order confirmed screen
│   │   │   └── failed/page.tsx   # Payment failed screen
│   │   ├── orders/
│   │   │   ├── page.tsx          # Order history list
│   │   │   └── [order_number]/page.tsx  # Order detail
│   │   └── profile/
│   │       ├── page.tsx          # Account info
│   │       └── addresses/page.tsx # Manage addresses (Mapbox picker lives here)
│   ├── (admin)/
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   ├── admin/dashboard/page.tsx
│   │   ├── admin/orders/page.tsx
│   │   ├── admin/users/page.tsx
│   │   └── admin/analytics/page.tsx
│   └── api/                      # ← Backend lives here (Route Handlers)
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth: Google + Credentials, JWT session
│       │   ├── signup/route.ts          # create inactive user + temp password + activation email
│       │   ├── activate/route.ts        # verify token+temp password → set real password
│       │   ├── resend-activation/route.ts
│       │   ├── forgotpassword/route.ts  # email reset link
│       │   ├── reset-password/route.ts  # consume reset token
│       │   └── updatepassword/route.ts  # profile change (logged in)
│       ├── address/
│       │   ├── getall/route.ts
│       │   ├── add/route.ts
│       │   ├── update/route.ts
│       │   ├── remove/route.ts
│       │   └── setdefault/route.ts
│       ├── menu/
│       │   ├── getall/route.ts
│       │   ├── getbycategory/route.ts
│       │   └── featured/route.ts
│       ├── cart/
│       │   ├── get/route.ts
│       │   ├── add/route.ts
│       │   ├── updateqty/route.ts
│       │   ├── remove/route.ts
│       │   └── clear/route.ts
│       ├── orders/
│       │   ├── create-razorpay/route.ts
│       │   ├── verify-payment/route.ts
│       │   ├── mark-failed/route.ts
│       │   └── mine/route.ts
│       ├── admin/
│       │   ├── menu/add|update|toggle/route.ts
│       │   ├── orders/getall|bystatus|updatestatus/route.ts
│       │   ├── users/getall/route.ts
│       │   └── analytics/itemsales|summary/route.ts
│       ├── webhook/
│       │   └── razorpay/route.ts # Razorpay webhook handler (signature verify)
│       ├── notifications/
│       │   └── token/route.ts    # POST save / DELETE remove this device's FCM token
│       └── firebase-sw/route.ts  # serves service worker JS (rewritten to /firebase-messaging-sw.js)
├── components/
│   ├── NotificationGate.tsx      # mandatory push-permission gate wrapping (user) + (admin) layouts
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Skeleton.tsx
│   ├── menu/
│   │   ├── MenuCard.tsx
│   │   └── CategoryTabs.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── address/
│   │   ├── AddressCard.tsx
│   │   └── AddressForm.tsx        # "Use current location" button + Mapbox pin picker
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   └── OrderStatusBadge.tsx
│   └── admin/
│       ├── StatCard.tsx
│       └── OrderRow.tsx
├── lib/
│   ├── db.ts                     # MongoDB client singleton (cached across hot reloads)
│   ├── auth.ts                   # NextAuth config — Google + Credentials providers, JWT session callbacks
│   ├── password.ts               # bcrypt helpers, temp-password + token generation
│   ├── email.ts                  # Resend client — sendWelcomeEmail, sendResetEmail
│   ├── razorpay.ts               # Razorpay client + signature verify (server-side)
│   ├── mapbox.ts                 # Mapbox geocode/reverse-geocode helper
│   ├── firebase-client.ts        # registerForNotifications(), saveNotificationToken(), getExistingFcmToken()
│   ├── firebase-admin.ts         # server-side Admin SDK — sendPush(tokens, {title, body, link})
│   ├── datetime.ts               # Asia/Kolkata timestamp helpers — nowIST(), formatIST() (see §18)
│   └── api.ts                    # fetch wrapper with auth header (client-side)
├── types/
│   └── models.ts                 # All shared interfaces (single source of truth)
├── hooks/
│   ├── useCart.ts                # Cart state + count
│   ├── useAuth.ts                # Current user
│   └── useAddresses.ts           # Address list management
├── public/
│   ├── manifest.json             # PWA manifest — "Add to Home Screen" (required for iOS push)
│   └── icons/                    # app icons referenced by manifest
└── middleware.ts                 # Next.js middleware for route protection
```

> `next.config.ts` needs a rewrite: `/firebase-messaging-sw.js` → `/api/firebase-sw`, so the service worker is servable from root scope (same trick as `couples-app`).

### Complete API Endpoints (all under `app/api/`)

```
# Auth
ANY    /api/auth/[...nextauth]     — NextAuth.js handlers: Google OAuth + Credentials sign-in, session JWT
POST   /api/auth/signup            — creates inactive user, generates temp password, sends welcome/activation email (Resend)
POST   /api/auth/activate          — { token, temp_password, new_password } → activates account, sets real password
POST   /api/auth/resend-activation — resend activation email if link expired
POST   /api/auth/forgotpassword    — { email } → emails a reset link (Resend), sets reset_token
POST   /api/auth/reset-password    — { token, new_password } → consumes reset_token (logged-out flow)
POST   /api/auth/updatepassword    — { current_password, new_password } → profile password change (logged-in, auth required)

# Address (auth required)
GET    /api/address/getall          — list my addresses
POST   /api/address/add             — add new address (accepts lat/lng from Mapbox)
PUT    /api/address/update          — update address by address_id
DELETE /api/address/remove          — remove address by address_id
PATCH  /api/address/setdefault      — set default address

# Menu (public)
GET    /api/menu/getall
GET    /api/menu/getbycategory?category=Meals
GET    /api/menu/featured

# Menu (admin)
POST   /api/admin/menu/add
PUT    /api/admin/menu/update
PATCH  /api/admin/menu/toggle

# Cart (auth required)
GET    /api/cart/get
POST   /api/cart/add
PUT    /api/cart/updateqty
DELETE /api/cart/remove
DELETE /api/cart/clear

# Orders (auth required)
POST   /api/orders/create-razorpay  — creates Razorpay order + saves pending order doc
POST   /api/orders/verify-payment   — verifies signature → marks confirmed
POST   /api/orders/mark-failed      — marks payment_failed
GET    /api/orders/mine             — user's order history

# Webhook (public, Razorpay calls this)
POST   /api/webhook/razorpay        — backup payment capture handler

# Push notifications (auth required)
POST   /api/notifications/token     — save this device's FCM token to fcmTokens[] (dedup)
DELETE /api/notifications/token     — remove this device's token (called on logout)
GET    /api/firebase-sw             — serves the FCM service worker JS (rewritten to /firebase-messaging-sw.js)

# Admin
GET    /api/admin/orders/getall
GET    /api/admin/orders/bystatus?status=confirmed
PATCH  /api/admin/orders/updatestatus   — (deferred: also triggers WhatsApp to customer once built)
GET    /api/admin/users/getall
GET    /api/admin/analytics/itemsales   — item-wise total qty sold, sorted
GET    /api/admin/analytics/summary     — total revenue, orders today, pending count
```

---

## 8. Shared TypeScript Models (`types/models.ts`)

```typescript
export interface Address {
  address_id: string;
  label: 'Home' | 'Work' | 'Other';
  full_address: string;
  area: string;
  city: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
  lat?: number;
  lng?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  is_admin: boolean;
  addresses: Address[];
  created_at: string;
}

export interface Nutrition {
  protein_g: number;
  carbs_g: number;
  fibre_g: number;
  calories: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  nutrition: Nutrition;
  is_available: boolean;
  is_featured: boolean;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_failed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user_snapshot: { name: string; mobile: string; email: string };
  delivery_address: Address;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: 'razorpay' | 'cod';
  payment_status: PaymentStatus;
  razorpay?: {
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    payment_captured_at?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  ErrorCode: '9999' | '9990';
  status: string;
  message: string;
  obj: T;
  count?: number;
}
```

---

## 9. Post-Registration Flow (Updated — temp password + activation)

```
Signup form submitted (name, email, mobile — NO password field)
      │
      ▼
Backend: POST /api/auth/signup
  → creates user doc, is_active=false, auth_provider="credentials"
  → generates temp password + activation_token (short expiry, e.g. 48h)
  → Resend sends welcome email:
      "Here's your temporary password: XXXXXXXX"
      "Activate your account: https://.../activate?token=..."
  → API responds success (no JWT yet — account is not usable till activated)
      │
      ▼
User opens email → clicks activation link → /activate?token=...
      │
      ▼
Activation page: enter temp password (from email) + choose new password
      │
      ▼
POST /api/auth/activate { token, temp_password, new_password }
  → verifies token + temp password hash match
  → sets password_hash = bcrypt(new_password), is_active=true, clears activation_token
  → returns JWT + user object (NextAuth session established)
      │
      ▼
Redirect → /menu   ← straight into the app, no separate login step
      │
      ▼
Menu page shows "Welcome, Shiva!" banner on first visit
Menu page shows featured items at top, then category tabs

──────────────────────────────────────────────────────────
Google sign-in (alternate path — no activation needed)
──────────────────────────────────────────────────────────
User clicks "Sign in with Google" → NextAuth Google OAuth flow
      │
      ▼
First-time Google sign-in → NextAuth callback creates user doc:
  auth_provider="google", is_active=true (Google already verified email)
      │
      ▼
Session JWT issued → Redirect → /menu directly (no activation, no temp password)
```

> **Expired/lost activation link:** `POST /api/auth/resend-activation` generates a fresh token + temp password and re-sends the email.
> **Login blocked while inactive:** Credentials sign-in via NextAuth checks `is_active` — if false, returns "Please activate your account" instead of a session.

---

## 10. Checkout Flow with Address + Razorpay

```
Cart page
  → Shows items + total
  → "Proceed to Checkout" button
       │
       ▼ (guard: must be logged in + cart not empty)
Checkout page
  → Shows: Address section + Order summary + Pay button
       │
       ├── If user has NO address saved:
       │       Show "Add address" form inline (required before Pay)
       │
       └── If user has address(es):
               Show address cards (default pre-selected)
               User can select different or add new
                     │
                     ▼
            [Confirm & Pay]
                     │
                     ▼
         POST /orders/create-razorpay
         → Backend creates Razorpay order
         → Backend saves order doc status="pending"
                     │
                     ▼
         Frontend opens Razorpay modal
                     │
              ┌──────┴──────┐
         SUCCESS         DISMISSED/FAILED
              │                │
              ▼                ▼
  POST /orders/verify-payment  POST /orders/mark-failed
  (signature check)             order status="payment_failed"
              │                       │
              ▼                       ▼
  order status="confirmed"     /checkout/failed
  cart cleared                 "Try again" button
  Redirect /checkout/success
  Show: order number + ETA
```

---

## 11. Admin Panel — Real-Time Order Feed

Admin panel orders page auto-refreshes every **30 seconds** (polling) or uses **Server-Sent Events** if you want instant push.

| Tab | Filter | What admin does |
|---|---|---|
| Received | `status = confirmed` | Click → set to "preparing" |
| Preparing | `status = preparing` | Click → set to "ready" |
| Ready | `status = ready` | Click → set to "delivered" |
| Delivered | `status = delivered` | View only |
| Failed | `status = payment_failed` | View only |
| All Orders | All | Full table with search |

**Order card shows:** order number, customer name, mobile, items list, total, address, time elapsed since order.

---

## 12. Admin Analytics

```
GET /admin/analytics/itemsales
→ MongoDB aggregation:
  db.orders.aggregate([
    { $match: { status: { $in: ["confirmed","preparing","ready","delivered"] } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", total_qty: { $sum: "$items.quantity" } } },
    { $sort: { total_qty: -1 } }
  ])
```

Returns: bar chart data → highest sold item at top, least sold at bottom.

---

## 13. Things You Missed — Add These

| # | What | Why it matters |
|---|---|---|
| 1 | **Minimum order amount** | Set ₹199 minimum — standard for cloud kitchens |
| 2 | **Delivery charge logic** | Free above ₹499, else ₹40 — show this in cart |
| 3 | **Menu item out-of-stock toggle** | Admin needs to hide sold-out items quickly |
| 4 | **Reorder button** | In order history: "Order Again" → repopulates cart |
| 5 | **Order cancellation** | User can cancel only when status = "confirmed" (before preparing) |
| 6 | **WhatsApp order-placed alert to admin** *(deferred)* | Silent, backend-only, when order placed — customer never sees it. Provider not chosen yet. |
| 6b | **WhatsApp order-confirmed alert to customer** *(deferred)* | Sent from business WhatsApp number when admin manually marks order "confirmed" in admin panel. |
| 7 | **OTP on mobile** | Optional: verify mobile number during signup (Twilio/MSG91) |
| 8 | **Menu categories from Excel** | Seed script to import your meal plan Excel → MongoDB on first run |
| 9 | **Privacy Policy + Terms page** | Required before Razorpay live mode approval |
| 10 | **Delivery area pin codes** | Optionally block checkout if pincode not in your delivery zone |
| 11 | **Search within menu** | Filter by name — important once you have 15+ items |
| 12 | **COD option** | Keep it as fallback even with Razorpay — many users prefer cash |
| 13 | **Current-location address capture** | Mapbox "use current location" button + pin-drop map + reverse geocoding in AddressForm |
| 14 | **Mandatory FCM push notifications** | Every user (incl. admin) must grant push permission at signup/new device before using the app — see §17 |
| 15 | **Same-day order cutoffs** | Lunch before 10:00 AM IST, dinner before 4:00 PM IST — see §19 |
| 16 | **WhatsApp contact button** | Floating `wa.me/919940749456` link on customer-facing pages — see §19 |

---

## 14. Build Order (Updated)

```
Phase 1 — Backend core (as Next.js Route Handlers, no Python)
  1. Next.js 14 scaffold + Tailwind + Framer Motion + .env.local
  2. lib/db.ts — MongoDB client singleton
  3. lib/auth.ts — NextAuth config (Google + Credentials providers, JWT session)
  4. lib/password.ts — bcrypt helpers, temp-password + token generation
  5. lib/email.ts — Resend client, welcome/activation + reset email templates
  6. app/api/auth/ — signup (temp password + email), activate, resend-activation,
     forgotpassword, reset-password, updatepassword, [...nextauth]
  7. lib/datetime.ts — Asia/Kolkata timestamp helpers, used from here on for every write
  8. app/api/address/ — CRUD, embedded in user doc (accepts lat/lng)
  9. app/api/menu/ — seed from Excel, get endpoints
  10. app/api/cart/ — CRUD
  11. app/api/orders/ — create-razorpay, verify-payment, mark-failed, mine (enforce lunch/dinner cutoffs)
  12. app/api/webhook/ — Razorpay webhook handler
  13. app/api/admin/ — users, orders, analytics aggregation
  14. lib/firebase-admin.ts + app/api/notifications/token/ + app/api/firebase-sw/ — FCM send/store/service-worker
  15. middleware.ts — route protection (session required on all non-public routes/APIs)

Phase 2 — Frontend foundation
  1. types/models.ts — all interfaces
  2. lib/api.ts — fetch wrapper
  3. lib/razorpay.ts — script loader
  4. lib/mapbox.ts — geocode/reverse-geocode helper
  5. lib/firebase-client.ts — registerForNotifications, saveNotificationToken, getExistingFcmToken
  6. public/manifest.json + app icons — PWA installability (required for iOS push)
  7. components/NotificationGate.tsx — mandatory push gate (ports Snug's pattern)
  8. hooks/ — useCart, useAuth, useAddresses

Phase 3 — Public pages
  1. Landing page with Framer Motion hero + "Why We Stand Out" section (invoke frontend-design skill, see §19)
  2. Login page — email/password + "Sign in with Google" button
  3. Signup page (name/email/mobile only) → shows "check your email" message
  4. Activation page (temp password + set new password) → redirect to /menu
  5. Forgot password page → reset-password page (token-based)
  6. WhatsAppFloatButton component on all customer-facing pages (§19)

Phase 4 — User pages
  1. Menu page (category tabs, search, featured section)
  2. Cart page (qty controls, address preview, delivery charge)
  3. Checkout page (address confirm/add, pay button)
  4. Order success / failed pages
  5. Order history + order detail
  6. Profile + addresses management (AddressForm with Mapbox current-location + pin picker)

Phase 5 — Admin pages
  1. Dashboard (stats cards)
  2. Orders with tab filters + inline status update
  3. Users list
  4. Analytics page (item bar chart)

Phase 6 — Polish & launch
  1. Mobile bottom nav
  2. Loading skeletons
  3. Toast notifications (order confirmed, cart updated)
  4. Delivery charge calculation in cart
  5. Minimum order validation
  6. Privacy Policy + Terms pages (for Razorpay live mode)
  7. Test Razorpay in test mode end-to-end
  8. Switch Razorpay to live mode
  9. Deploy Next.js (single project) → Vercel

Phase 7 — Deferred, build later when asked
  1. WhatsApp order-placed alert to admin
  2. WhatsApp order-confirmed alert to customer
```

---

## 15. `.env.local` Config

```
# MongoDB
MONGO_URL=mongodb+srv://...
DB_NAME=repeat_calories

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000        # update to prod/custom domain URL later — see §16
JWT_EXPIRY_HOURS=72

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend (email)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=repeatcalories@gmail.com       # update once a custom domain is verified in Resend

# Firebase Cloud Messaging (push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=

# Razorpay
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Admin seed
ADMIN_EMAIL=admin@repeatcalories.com
ADMIN_PASSWORD=your_admin_password

# Optional
DELIVERY_CHARGE=40
FREE_DELIVERY_ABOVE=499
MIN_ORDER_AMOUNT=199
```

---

## 16. Auth Q&A — Confirmed Answers

**Q: If we add a custom domain later, will existing Google sign-in users be affected?**
No. Google matches users by their Google account `sub` (unique ID) + email, which your app stores in MongoDB — not by which domain your app is hosted on. Adding a domain later only means:
- Add the new domain to "Authorized JavaScript origins / Redirect URIs" in Google Cloud Console (the old Vercel URL can stay too)
- Update `NEXTAUTH_URL` to the new domain
- Optionally re-brand the OAuth consent screen (homepage link, support email)

No existing user rows are touched, and no one is logged out or loses their account.

**Q: Forgot password vs. update password in profile — are these different?**
Yes, two separate flows, both kept:
- **Forgot password** (`/forgot` → `/reset-password?token=`) — logged-out user requests a reset email, clicks the link, sets a new password with no old password required. Uses `reset_token`/`reset_token_expires` on the user doc.
- **Update password** (profile page, logged in) — requires entering the *current* password plus a new one. No email/token involved.

**Q: Does JWT apply to Google sign-in too?**
Yes — NextAuth issues the same JWT session regardless of provider (Google or Credentials). `middleware.ts` and every `app/api/**` handler check that session/JWT the same way; there's no special-casing per login method.

---

## 17. Push Notifications (FCM) — Mandatory, pattern reused from `couples-app` ("Snug")

**Hard technical constraint:** iOS Safari cannot receive web push at all unless the site has been added to the home screen as a PWA (iOS 16.4+). There is no way around this — it's an Apple platform restriction, not a code limitation. Decision made: ship the site as an installable PWA so this works everywhere, rather than skip iOS support.

### Flow
```
User registers OR logs in on a device where Notification.permission !== "granted"
      │
      ▼
NotificationGate (wraps the whole (user)/(admin) layout, same component
for both — admin is just a user with is_admin:true) checks
window.Notification.permission on every login and on tab visibility change
      │
      ▼
If not "granted" → full-screen blocking overlay:
  "Turn on notifications to continue" — everything else is inert underneath
  (matches Snug's NotificationGate.tsx exactly)
      │
      ▼
User taps "Enable Notifications"
      │
      ▼
registerForNotifications():
  1. Notification.requestPermission()
  2. navigator.serviceWorker.register('/firebase-messaging-sw.js')
  3. wait for registration.ready (iOS fails silently if SW still installing)
  4. getMessaging() + getToken(vapidKey, serviceWorkerRegistration)
      │
      ▼
saveNotificationToken(token) → POST /api/notifications/token
  → $addToSet into users.fcmTokens[] (deduped, multiple devices per user)
      │
      ▼
Gate re-checks permission → granted → overlay disappears → app usable
```

- **"New device" needs no separate tracking table** — a device/browser that has never granted permission is always `Notification.permission === "default"` until it does, so the same gate check naturally catches every new device without any device-fingerprinting.
- **Denied case:** overlay shows different copy ("Notifications are blocked — open your browser's site settings → Allow, then come back") with a "Recheck" button, same as Snug.
- **Logout:** `getExistingFcmToken()` (never triggers a fresh permission prompt) + `DELETE /api/notifications/token` removes this device's token from `fcmTokens[]`, so a shared/logged-out device stops receiving pushes for that account.
- **Excluded routes:** `/login`, `/signup`, `/activate`, `/forgot`, `/reset-password` — never gated (can't require notifications before an account exists).

### Sending pushes (server-side, `lib/firebase-admin.ts`)
| Trigger | Sent to | Payload |
|---|---|---|
| Order placed (payment verified / COD confirmed) | Admin's `fcmTokens[]` | "New order RC-2026-0001 — ₹638" |
| Admin updates order status | That customer's `fcmTokens[]` | "Your order is now {status}" |

Uses `sendEachForMulticast` for multi-device users, same as Snug's `sendNudge()`. Invalid/expired tokens are ignored by Firebase, not treated as errors — no manual cleanup needed for launch.

### What you need to set up (Firebase Console, free Spark plan)
1. Create a Firebase project
2. Cloud Messaging → generate a **Web Push certificate (VAPID key)**
3. Project Settings → Service Accounts → generate a **service account JSON** (server-side send)
4. Project Settings → General → add a Web app → copy the client config

### New env vars
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=          # full JSON, one line, from step 3 above
```

---

## 18. Timezone — Chennai / Asia/Kolkata, everywhere

All captured timestamps across every collection (`users.created_at/updated_at`, token expiries, `orders.created_at/updated_at`, `razorpay.payment_captured_at`, `order_number`'s date component, cart `updated_at`) use **`Asia/Kolkata` (IST, UTC+5:30, Chennai's zone — India has one timezone nationwide, no separate "Chennai" zone id)**.

India has no DST, so there's no ambiguity risk in storing IST directly (unlike, say, US timezones). Approach: `lib/datetime.ts` wraps `dayjs` + `dayjs/plugin/timezone`/`utc`, hardcoded to `Asia/Kolkata`, used everywhere instead of raw `new Date()` — every write goes through `nowIST()`, every display through `formatIST()`. This keeps timestamps human-readable as true local time in the database itself, not just at display time.

---

## 19. Business Rules from Brand Notes (added from WhatsApp brief)

**Same-day order cutoffs** (added to Key Business Rules and checkout validation):
- Lunch category items: orderable only before **10:00 AM IST**, same day
- Dinner category items: orderable only before **4:00 PM IST**, same day
- After cutoff, that category is disabled/hidden in the menu until its next window — enforce both in the UI (grey out + message) and server-side in `POST /api/orders/create-razorpay` (reject with a clear error if attempted past cutoff)

**WhatsApp contact button** (separate from the deferred FCM-adjacent WhatsApp order-notification feature — this is just a static "chat with us" link):
- Floating WhatsApp button on all customer-facing pages → `https://wa.me/919940749456`
- Add as `components/ui/WhatsAppFloatButton.tsx`

**Landing page "Why We Stand Out" section content** (from brand brief, for the frontend-design skill to build):
- Clear ingredients — nothing hidden, everything shown
- Sourcing from our own farm
- Chicken from a proper, trusted shop
- Not just "healthy" — right time, right meal, with proper calorie counts is what actually counts

---

## Summary

- **4 MongoDB collections:** `users` (addresses embedded, incl. lat/lng, activation/reset tokens), `menu_items`, `carts`, `orders`
- **Single `types/models.ts`** — all interfaces, used everywhere in frontend
- **Single API response format** — `ErrorCode: 9999/9990`
- **Auth: NextAuth.js** — Google OAuth + Credentials (bcrypt), JWT session on every request, logged-out users blocked from all non-public routes/APIs
- **Signup: temp password + forced activation** — welcome email (Resend) with temp password + activation link → user sets real password → into `/menu`. Google sign-ups skip activation entirely.
- **Forgot password (token, logged-out) vs. update password (current+new, logged-in profile)** — kept as two separate flows
- **Custom domain later will not affect existing Google-signed-in users** — see §16
- **Address required before checkout** — enforced at checkout page, not cart
- **Mapbox current-location + pin picker** for address capture
- **Razorpay full flow** — create order → modal → verify signature → confirmed/failed
- **Webhook backup** — handles browser-close mid-payment scenarios
- **Admin sees orders in real-time** — 30s polling or SSE
- **Framework:** single Next.js 14 project (SSR landing, image optimization, Route Handlers as backend, one Vercel deploy)
- **No Python, no separate backend host** — MongoDB Node driver + NextAuth + bcryptjs
- **Push notifications: FCM, mandatory** — ported from `couples-app`'s proven pattern (PWA + service worker + NotificationGate). Blocks app usage until permission granted; naturally covers new devices with no extra tracking. Sends: order-placed → admin, status-update → customer.
- **All timestamps stored in Asia/Kolkata (Chennai/IST)** — via `lib/datetime.ts`, not raw UTC `Date()`
- **Same-day order cutoffs:** lunch before 10:00 AM IST, dinner before 4:00 PM IST — enforced client + server side
- **WhatsApp order notifications (order-placed → admin, order-confirmed → customer): still deferred**, build only when explicitly asked — separate from the always-visible WhatsApp *contact* button, which is in scope now
- **MongoDB stays as the database** — confirmed over Supabase (free-tier storage is a wash at ~500MB either way; Supabase's free-tier auto-pause after 7 days of inactivity is the deciding risk for a live ordering app)
