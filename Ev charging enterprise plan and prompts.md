# EV Charging Sharing Platform — Enterprise Architecture + Step-by-Step AI Agent Prompts

---

## PART 1 — Aapke Current Plan Ka Review

Aapka MVP doc bohot achi tarha organized hai — chat/call/Google auth ka implementation clear hai. Lekin "enterprise-level" ke liye kuch cheezein change/improve karni chahiye:

### Kya theek hai, rehne dein
- Leaflet + OpenStreetMap (free, no API key) — perfect choice, isay change mat karein.
- `tel:` link based call — enterprise ke liye bhi fine hai, sirf note kar dein ke future mein call-masking add hogi.
- Manual subscription (JazzCash/EasyPaisa + admin approval) — MVP se enterprise tak scale karne ke liye theek hai, bas schema future-proof honi chahiye.

### Kya change karna chahiye (enterprise-grade ke liye)

| Area | MVP Doc Mein | Enterprise Recommendation | Wajah |
|---|---|---|---|
| Database | MongoDB Atlas | **PostgreSQL + PostGIS** (Supabase/Neon free tier) | Bookings, subscriptions, payments — sab relational data hai jismein foreign keys, transactions (ACID) aur joins chahiye hote hain. PostGIS geospatial "nearby search" ke liye Mongo se zyada powerful aur industry-standard hai. |
| Backend Framework | Plain Express.js | **NestJS** | Aapne khud NestJS mangwaya hai — ye modular architecture, dependency injection, guards, pipes, interceptors deta hai jo enterprise codebase ke liye zaroori hai. |
| ORM | Mongoose | **Prisma** (type-safe, Postgres ke sath best) | Type safety + auto migrations + easy schema management. |
| Auth | Sirf JWT (long expiry) | **Access token (15 min) + Refresh token (httpOnly cookie, rotated)** | Long-lived JWT security risk hai; refresh token pattern industry standard hai. |
| Validation | Nahi mention hui | **class-validator + class-transformer DTOs har route par** | Input validation security ka pehla layer hai — aapne khud ye mangwaya hai. |
| Rate Limiting | Nahi hai | **@nestjs/throttler** | Login/OTP/booking spam se bachne ke liye zaroori. |
| File Upload Security | Basic multer | **Mime-type whitelist + size limit + virus-scan-ready structure** | CNIC images/screenshots sensitive hain. |
| Realtime Chat | Raw Socket.io on Express | **NestJS WebSocket Gateway** (same Socket.io engine, but modular + guarded) | Auth guard chat socket par bhi lagni chahiye, warna koi bhi kisi ki chat join kar sakta hai. |
| Caching | Nahi hai | **Redis (Upstash free tier)** — nearby-station search cache, rate-limit store, refresh-token store | Free tier available hai, performance + security dono improve hoti hai. |
| Logging/Monitoring | Nahi mention | **Pino/Winston structured logging + global exception filter** | Debugging aur production issues track karne ke liye. |
| API structure | REST routes flat | **Modular (feature-based modules)** — auth, users, stations, bookings, subscriptions, chat, admin | Har module apna controller/service/DTO/repository rakhega — scale karna easy hoga. |

### Naya Free Stack (Enterprise-Ready, still PKR 0)

| Layer | Tool | Free Tier |
|---|---|---|
| Backend Framework | NestJS (TypeScript) | Free |
| ORM | Prisma | Free |
| Database | PostgreSQL via **Supabase** or **Neon** (has PostGIS) | Free forever tier |
| Cache / Rate-limit store / Refresh tokens | Redis via **Upstash** | Free tier (10k commands/day) |
| Image Storage | Cloudinary | 25GB free |
| Auth | JWT (access+refresh) + Google OAuth (Passport.js) | Free |
| Realtime | Socket.io (NestJS Gateway) | Free, self-hosted |
| Backend Hosting | Render.com (Web Service) | Free (sleeps on inactivity) |
| Frontend | React (Vite) + TypeScript | Free |
| UI | TailwindCSS + shadcn/ui | Free |
| Animation | Framer Motion | Free |
| State/data fetching | TanStack React Query + Zustand | Free |
| Map | React-Leaflet + OpenStreetMap | Free |
| Frontend Hosting | Vercel | Free |
| Version Control / CI | GitHub + GitHub Actions | Free |

---

## PART 2 — Enterprise Architecture Diagram

```
                            ┌───────────────────────────────┐
                            │        CLIENTS (Browser)       │
                            │  Driver / Host / Admin roles    │
                            └───────────────┬─────────────────┘
                                            │ HTTPS (REST) + WSS (Socket.io)
                                            ▼
                    ┌─────────────────────────────────────────────┐
                    │        FRONTEND — React + Vite + TS           │
                    │  Tailwind + shadcn/ui + Framer Motion          │
                    │  React Query (server state) + Zustand (UI)     │
                    │  React-Leaflet map                              │
                    │  Hosted: Vercel (Free)                          │
                    └───────────────────┬───────────────────────────┘
                                        │ Axios (JWT access token in header)
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │        BACKEND — NestJS (Modular Monolith)     │
                    │  ┌───────────┬───────────┬───────────────┐    │
                    │  │ AuthModule│ UsersModule│ StationsModule│    │
                    │  ├───────────┼───────────┼───────────────┤    │
                    │  │BookingsMod│ ChatGateway│AdminModule    │    │
                    │  ├───────────┴───────────┴───────────────┤    │
                    │  │ Global: Guards, Pipes (validation),     │    │
                    │  │ Interceptors, Exception Filters, Throttler│  │
                    │  └─────────────────────────────────────────┘   │
                    │  Hosted: Render.com Web Service (Free)          │
                    └───────┬───────────────┬────────────────┬───────┘
                            ▼               ▼                ▼
                ┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
                │ PostgreSQL+PostGIS │ │ Redis        │ │ Cloudinary        │
                │ via Supabase/Neon  │ │ via Upstash   │ │ (images: CNIC,     │
                │ Prisma ORM         │ │ (cache,       │ │ station photos)    │
                │ (Users, Stations,  │ │  rate-limit,  │ │                    │
                │  Bookings,         │ │  refresh      │ └──────────────────┘
                │  Subscriptions,    │ │  tokens)      │
                │  Messages)         │ └─────────────┘
                └──────────────────┘
```

**Total monthly cost: PKR 0** — sab free tiers par, bas enterprise-grade structure ke sath.

---

## PART 3 — Database Schema (Prisma, PostgreSQL)

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  phone         String   @unique
  email         String   @unique
  passwordHash  String?
  authProvider  AuthProvider @default(LOCAL)
  googleId      String?  @unique
  role          Role     @default(DRIVER)
  cnicImageUrl  String?
  cnicNumber    String?
  isVerified    Boolean  @default(false)
  refreshTokenHash String?
  createdAt     DateTime @default(now())
  stations      Station[]
  bookings      Booking[]
  sentMessages     Message[] @relation("sender")
  receivedMessages Message[] @relation("receiver")
  subscriptions Subscription[]
}

enum AuthProvider { LOCAL GOOGLE }
enum Role { DRIVER HOST ADMIN }

model Station {
  id                 String   @id @default(uuid())
  host               User     @relation(fields: [hostId], references: [id])
  hostId             String
  stationType        StationType
  stationName        String
  latitude           Float
  longitude          Float
  address            String
  capacity           String
  connectorType      String
  pricePerKwh        Float
  photos             String[]
  isAvailable        Boolean  @default(true)
  verificationStatus VerificationStatus @default(PENDING)
  subscriptionExpiry DateTime?
  createdAt          DateTime @default(now())
  bookings           Booking[]
  messages           Message[]
  // Geospatial index added via raw SQL migration (PostGIS geography column)
}

enum StationType { HOUSEHOLD PUBLIC }
enum VerificationStatus { PENDING APPROVED REJECTED }

model Booking {
  id            String   @id @default(uuid())
  driver        User     @relation(fields: [driverId], references: [id])
  driverId      String
  station       Station  @relation(fields: [stationId], references: [id])
  stationId     String
  date          DateTime
  timeSlot      String
  status        BookingStatus @default(PENDING)
  unitsCharged  Float?
  totalAmount   Float?
  createdAt     DateTime @default(now())
}

enum BookingStatus { PENDING CONFIRMED COMPLETED CANCELLED }

model Subscription {
  id            String   @id @default(uuid())
  host          User     @relation(fields: [hostId], references: [id])
  hostId        String
  amount        Float
  transactionId String
  screenshotUrl String
  status        SubStatus @default(PENDING)
  approvedBy    String?
  validTill     DateTime?
  createdAt     DateTime @default(now())
}

enum SubStatus { PENDING APPROVED REJECTED }

model Message {
  id             String   @id @default(uuid())
  conversationId String
  sender         User     @relation("sender", fields: [senderId], references: [id])
  senderId       String
  receiver       User     @relation("receiver", fields: [receiverId], references: [id])
  receiverId     String
  station        Station  @relation(fields: [stationId], references: [id])
  stationId      String
  text           String
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())

  @@index([conversationId, createdAt])
}
```

> Geospatial "nearby search" PostGIS raw query se hoga (`ST_DWithin`), Prisma raw query support karta hai — Phase 3 ke prompt mein iska poora code diya gaya hai.

---

## PART 4 — Backend Step-by-Step Prompts (NestJS)

Neeche har phase ek **complete, self-contained prompt** hai. Inhein Claude Code / Cursor / kisi bhi AI coding agent mein **ek ek karke, sequence mein** paste karein. Har phase pichle phase par build karta hai.

### Backend Phase 0 — Project Setup
```
Create a new NestJS backend project called "ev-charge-api" using TypeScript.
Set up the following:
1. Install and configure: @nestjs/config, prisma, @prisma/client, class-validator,
   class-transformer, @nestjs/throttler, helmet, cookie-parser, bcryptjs, jsonwebtoken,
   @nestjs/jwt, @nestjs/passport, passport, passport-jwt, google-auth-library,
   ioredis, cloudinary, multer, pino, nestjs-pino.
2. Set up Prisma with PostgreSQL. Use the schema I will provide.
3. Configure global ValidationPipe (whitelist: true, forbidNonWhitelisted: true, transform: true).
4. Configure Helmet, CORS (whitelist from env var FRONTEND_URL), cookie-parser.
5. Set up a global exception filter that returns consistent JSON error shape:
   { statusCode, message, error, timestamp, path }.
6. Set up Pino structured logging with request logging middleware.
7. Set up @nestjs/throttler globally: 100 requests per 60 seconds by default.
8. Create folder structure: src/modules/{auth,users,stations,bookings,subscriptions,chat,admin}
   each with controller, service, dto, entities subfolders.
9. Create .env.example with: DATABASE_URL, REDIS_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
   CLOUDINARY_API_SECRET, FRONTEND_URL, PORT.
10. Add a /health endpoint that checks DB and Redis connectivity.
Explain the folder structure you created before writing code.
```

### Backend Phase 1 — Database Schema & Prisma
```
Using the Prisma schema below, generate the schema.prisma file and run the initial migration.
[PASTE THE SCHEMA FROM "PART 3" ABOVE HERE]

After the migration, write a raw SQL migration file that:
1. Enables the PostGIS extension: CREATE EXTENSION IF NOT EXISTS postgis;
2. Adds a generated geography column to the Station table:
   ALTER TABLE "Station" ADD COLUMN geog geography(Point, 4326)
     GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
3. Creates a GIST index on that column for fast nearby search:
   CREATE INDEX station_geog_idx ON "Station" USING GIST (geog);

Then create a PrismaService (injectable, implements OnModuleInit/OnModuleDestroy)
and a PrismaModule that is Global and imported once in AppModule.
```

### Backend Phase 2 — Auth Module (Email/Password + Google + Refresh Tokens)
```
Build the AuthModule with the following, using DTOs validated with class-validator:

1. POST /auth/signup — body: { name, phone, email, password, role }.
   Hash password with bcrypt (12 rounds). Validate phone is a valid Pakistani mobile
   number format (03XXXXXXXXX) and email is valid. Return access token (15 min expiry)
   as JSON, and set refresh token (7 day expiry) as an httpOnly, secure, sameSite=strict
   cookie. Store a hash of the refresh token in Redis keyed by userId (not the plain token).

2. POST /auth/login — body: { email, password }. Same token issuance as above.
   Rate-limit this route specifically to 5 attempts per 15 minutes per IP using
   @nestjs/throttler's @Throttle decorator.

3. POST /auth/google — body: { idToken }. Verify with google-auth-library using
   GOOGLE_CLIENT_ID. If user doesn't exist, create with authProvider=GOOGLE.
   If user has no phone number yet, return needsPhoneNumber: true in the response
   (do not fail the request).

4. POST /auth/complete-profile — protected route, body: { phone }. Lets a Google-signup
   user add their phone number (required for chat/call features).

5. POST /auth/refresh — reads refresh token from httpOnly cookie, validates against
   the hash stored in Redis, issues a new access token AND rotates the refresh token
   (invalidate old one, issue and store new one). This prevents refresh token replay attacks.

6. POST /auth/logout — deletes the refresh token from Redis and clears the cookie.

7. Create a JwtAuthGuard (validates access token from Authorization: Bearer header)
   and a RolesGuard + @Roles() decorator for role-based access control (DRIVER/HOST/ADMIN).

8. Never return passwordHash or refreshTokenHash in any response — use a
   class-transformer @Exclude() on the entity or a response DTO mapper.

Write unit tests for the signup and login flows covering: duplicate email,
wrong password, and successful login.
```

### Backend Phase 3 — Users & Stations Module (with Geospatial Search)
```
Build the UsersModule:
- GET /users/me — protected, returns current user profile (no sensitive fields).
- PATCH /users/me — update name/phone with validation.
- POST /users/me/cnic — multer file upload (jpg/png only, max 5MB), upload to
  Cloudinary, save cnicImageUrl + cnicNumber.

Build the StationsModule:
- POST /stations — protected, role=HOST only. DTO validates: stationName (string,
  3-100 chars), latitude/longitude (valid ranges), capacity (enum: 7kW/11kW/22kW/DC Fast),
  connectorType (enum: Type2/CCS2/CHAdeMO/GB-T), pricePerKwh (positive number),
  address (string). Creates station with verificationStatus=PENDING.
- POST /stations/:id/photos — multer upload (max 5 images, 5MB each, jpg/png/webp only),
  upload to Cloudinary, append URLs to photos array.
- PATCH /stations/:id — protected, only the owning host can edit (check hostId === req.user.id).
- GET /stations/nearby?lat=&lng=&radiusMeters=5000 — public route. Use Prisma
  $queryRaw with PostGIS ST_DWithin against the geog column for the search, joined
  with a Redis cache (cache key: rounded lat/lng + radius, TTL 60 seconds) to avoid
  hammering the DB on a busy map. Only return verificationStatus=APPROVED and
  isAvailable=true stations, and stations whose subscriptionExpiry (for HOUSEHOLD type)
  is either null or in the future.
- GET /stations/:id — public, single station details.

Write a cron-style scheduled task (use @nestjs/schedule) that runs daily and sets
isAvailable=false for any household station whose subscriptionExpiry has passed.
```

### Backend Phase 4 — Bookings Module
```
Build the BookingsModule:
- POST /bookings — protected, role=DRIVER. Validates stationId exists, date is not
  in the past, timeSlot doesn't already have a CONFIRMED booking for that station
  (check inside a Prisma transaction to prevent double-booking race conditions).
- GET /bookings/mine — protected, returns driver's own bookings.
- GET /bookings/host — protected, role=HOST. Returns bookings for stations owned by
  this host.
- PATCH /bookings/:id/status — protected, only the host who owns the station can
  confirm/reject; only the driver who made it can cancel. Validate status transitions
  (e.g. can't confirm an already-cancelled booking) with a small state machine.

Add integration tests for the double-booking race condition using Promise.all with
two simultaneous booking requests for the same slot — confirm only one succeeds.
```

### Backend Phase 5 — Realtime Chat (NestJS WebSocket Gateway)
```
Build a ChatModule with a ChatGateway (Socket.io, namespace "/chat"):
1. Use a WsJwtGuard — every socket connection must present a valid access token
   (sent in the `auth` handshake payload), decode it, and attach the user to the socket.
   Reject unauthenticated connections.
2. On connection, auto-join the socket to a room named after the userId.
3. `sendMessage` event: payload { receiverId, stationId, text }. Validate text is
   1-2000 chars and not empty/whitespace-only. Derive senderId from the authenticated
   socket, never trust a client-supplied senderId. Save to DB via ChatService,
   compute conversationId as the sorted [senderId, receiverId, stationId] joined string.
   Emit `receiveMessage` to the receiver's room and `messageSent` back to the sender.
4. REST endpoint GET /messages/:userId/:otherUserId/:stationId — protected, paginated
   (cursor-based, 30 messages per page), returns chat history ordered by createdAt.
   Verify the requesting user is either the sender or receiver party — no one else
   can read this conversation.
5. Mark messages as read: PATCH /messages/:conversationId/read.

Add rate limiting on the sendMessage socket event (max 20 messages per 10 seconds
per user) to prevent spam, using a simple Redis counter.
```

### Backend Phase 6 — Subscriptions & Admin Module
```
Build the SubscriptionsModule:
- POST /subscriptions — protected, role=HOST. Body: { amount, transactionId,
  screenshotUrl (uploaded via a separate /subscriptions/upload-proof multer route
  to Cloudinary first) }. Creates with status=PENDING.
- GET /subscriptions/mine — host's own subscription history.

Build the AdminModule (all routes protected with RolesGuard, role=ADMIN):
- GET /admin/stations/pending — list stations awaiting verification.
- PATCH /admin/stations/:id/verify — body: { status: APPROVED|REJECTED }.
- GET /admin/subscriptions/pending — list pending subscription proofs.
- PATCH /admin/subscriptions/:id/verify — body: { status }. On APPROVED, in a
  Prisma transaction: set subscription.status=APPROVED, subscription.validTill =
  now + 30 days, AND update the related station's subscriptionExpiry to match.
- GET /admin/users — list users with filters (role, isVerified).
- PATCH /admin/users/:id/verify — approve CNIC verification.

Ensure every admin action is written to a simple AuditLog table
(adminId, action, targetType, targetId, timestamp) for accountability.
```

### Backend Phase 7 — Security Hardening & Final Checks
```
Do a full security pass on the codebase:
1. Confirm every mutating route (POST/PATCH/DELETE) has a DTO with class-validator
   decorators and no route accepts unvalidated raw body fields.
2. Confirm ownership checks exist everywhere a user could otherwise modify someone
   else's resource (stations, bookings, messages, subscriptions).
3. Add helmet with a strict Content-Security-Policy.
4. Add global rate limiting + stricter limits on auth routes (already done in Phase 2 —
   verify it's still correctly applied).
5. Ensure all secrets are read from process.env via @nestjs/config, never hardcoded.
6. Ensure file uploads reject anything outside allowed mime types and sizes, and that
   uploaded filenames are never used directly in file paths (avoid path traversal).
7. Add a Swagger (OpenAPI) doc at /api/docs using @nestjs/swagger, but disable it
   automatically when NODE_ENV=production unless an ADMIN_DOCS_TOKEN query param matches.
8. Write a README with setup instructions, env vars, and how to run migrations.
9. Prepare a render.yaml or Dockerfile for deployment to Render.com free tier.

Summarize any vulnerabilities you find and fix them, then list what you fixed.
```

---

## PART 5 — Frontend Step-by-Step Prompts (React + Premium UI)

**Design reference:** https://dribbble.com/shots/25705401-EV-Charging-Stations-Website
**Style direction:** Clean, modern, green/dark gradient EV theme, glassmorphism cards,
smooth scroll-triggered animations, generous whitespace, bold typography — NOT a generic
AI-template look. Real photography, not illustrations/AI-art.

**Image sources to give the agent (free, real, direct-linkable, no AI-generated look):**
- Unsplash Source API style direct links (use these directly as `<img src>` — no download needed):
  - EV charging hero: `https://images.unsplash.com/photo-1593941707882-a5bba14938c7`
  - EV charging close-up: `https://images.unsplash.com/photo-1697811827966-27bc1c73f5f3`
  - Home charger on wall: `https://images.unsplash.com/photo-1647500947438-8c37d3d63a95`
  - Electric car charging night: `https://images.unsplash.com/photo-1647500948155-7d0d3f5e9e0b`
  - Person plugging in EV: `https://images.unsplash.com/photo-1617704548623-340376564e68`
  - Map/city aerial: `https://images.unsplash.com/photo-1524661135-423995f22d0b`
  (Tell the agent: append `?auto=format&fit=crop&w=1600&q=80` to any Unsplash URL for
  a responsive, compressed version. If a specific photo ID 404s, search unsplash.com
  for "EV charging" / "electric car home charger" and substitute a working URL — never
  generate a fake image.)
- Icons: use `lucide-react` (already free, no external links needed).

### Frontend Phase 0 — Project Setup & Design System
```
Create a React + Vite + TypeScript project called "ev-charge-web". Set up:
1. TailwindCSS with a custom theme: primary color a deep electric green (#0F9D58 family),
   accent a vivid teal/lime for CTAs, dark mode background (#0B1120 style near-black navy),
   font pairing: a bold display font (e.g. "Sora" or "Space Grotesk" via Google Fonts)
   for headings, "Inter" for body text.
2. Install: framer-motion, react-router-dom, @tanstack/react-query, axios, zustand,
   react-leaflet, leaflet, lucide-react, react-hook-form, zod, @hookform/resolvers,
   socket.io-client, sonner (toast notifications), shadcn/ui (init it with the theme above).
3. Set up folder structure:
   src/{components/ui, components/shared, features/{auth,map,stations,bookings,chat,
   admin,landing}, lib, hooks, store, api, types}
4. Set up an axios instance (lib/api.ts) with baseURL from VITE_API_URL, a request
   interceptor that attaches the access token from the Zustand auth store, and a
   response interceptor that on 401 calls /auth/refresh once and retries the original
   request (silent token refresh pattern) — logout if refresh also fails.
5. Set up React Query provider and React Router with routes: "/", "/login", "/signup",
   "/map", "/host/dashboard", "/host/station/new", "/bookings", "/chat/:conversationId",
   "/admin", each with placeholder pages for now.
6. Do NOT use any AI-image-generation. Use the Unsplash URLs I'll give per page,
   or lucide-react icons for iconography.
```

### Frontend Phase 1 — Landing Page (Premium, Animated)
```
Build a premium animated landing page at "/", inspired stylistically by
https://dribbble.com/shots/25705401-EV-Charging-Stations-Website (dark, high-contrast,
bold hero typography, glowing green accents — but make it your own composition,
don't copy it pixel-for-pixel).

Sections, each with Framer Motion scroll-reveal (staggered fade+slide-up, whileInView):
1. Sticky glassmorphism navbar (blurred background on scroll) with logo, nav links,
   "Login" and "Get Started" buttons.
2. Hero: bold headline (e.g. "Charge Anywhere. Earn Everywhere."), subheadline, two CTAs
   ("Find a Charger" / "Become a Host"), and a hero image using:
   https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80
   Add a subtle floating/parallax effect on the hero image on mouse move.
3. "How it works" — 3-step animated cards (Host registers → Driver finds & books →
   Both earn/save), icons from lucide-react, cards animate in on scroll with stagger.
4. Live map teaser section — embed a small non-interactive preview React-Leaflet map
   centered on Lahore (31.5497, 74.3436) with 3-4 dummy markers, "Explore full map" CTA.
5. Stats counter section (animated count-up on scroll into view) — e.g. "500+ Chargers",
   "10,000+ kWh Shared", "PKR 0 Platform Fee for early hosts" — use framer-motion's
   useInView + a count-up hook.
6. Testimonial/trust section with a horizontally auto-scrolling marquee of quote cards.
7. Host CTA banner with the image:
   https://images.unsplash.com/photo-1647500947438-8c37d3d63a95?auto=format&fit=crop&w=1600&q=80
8. Footer with links, social icons, and a subtle green glow gradient background.

Make every interactive element (buttons, cards) have a hover micro-interaction
(scale/glow) using Framer Motion's whileHover. Ensure it's fully responsive on mobile
(stack sections, reduce animation intensity on small screens for performance).
```

### Frontend Phase 2 — Auth Pages (Login/Signup + Google)
```
Build /login and /signup pages, split-screen layout: left side a form on a card with
subtle glass effect, right side a full-height image
(https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=1200&q=80)
with a gradient overlay and a short motivational quote.

1. Use react-hook-form + zod for validation matching backend rules (Pakistani phone
   format 03XXXXXXXXX, email, password min 8 chars with at least one number).
2. Signup form includes a role toggle (Driver / Host) styled as animated segmented
   control, not a plain dropdown.
3. Integrate @react-oauth/google "Continue with Google" button styled to match the
   dark theme. On success, POST to /auth/google; if response.needsPhoneNumber is true,
   show an animated modal (Framer Motion AnimatePresence) asking for phone number
   before continuing.
4. Show inline field-level error messages (shake animation on invalid submit).
5. Show a toast (sonner) on success/failure. Store access token + user in the Zustand
   auth store on success, redirect based on role (driver → /map, host → /host/dashboard).
6. Add password visibility toggle and a loading spinner state on the submit button.
```

### Frontend Phase 3 — Map & Station Search (Driver View)
```
Build the /map page:
1. Full-screen React-Leaflet map (OpenStreetMap tiles), user's location auto-detected
   via browser Geolocation API (with graceful fallback to Lahore center if denied).
2. Custom green pin markers, clustered with react-leaflet's marker clustering for
   dense areas. Clicking a marker opens an animated bottom-sheet (mobile) / side panel
   (desktop) showing StationCard: photos carousel, capacity, connector type, price,
   host name, "Book Now", "Chat", and "Call" buttons.
3. A floating search/filter bar on top: filter by connector type, max price, and
   "household only / public only" toggle — filters call GET /stations/nearby with
   query params and React Query.
4. "Call" button = simple `<a href="tel:...">`. "Chat" button navigates to
   /chat/:conversationId (create the conversationId client-side matching backend logic).
5. Loading skeleton for the station panel while fetching, empty state illustration
   (use a lucide-react icon, not an image) when no stations found nearby.
```

### Frontend Phase 4 — Host Dashboard & Station Registration
```
Build /host/dashboard:
1. Overview cards (animated count-up): total stations, pending bookings, subscription
   status/expiry countdown.
2. List of host's stations as cards with status badges (Pending/Approved/Rejected),
   edit and "upload photos" actions.
3. Bookings tab: incoming bookings with Confirm/Reject buttons (optimistic UI update
   via React Query mutations).
4. Subscription tab: current status, "Renew Subscription" flow — shows JazzCash/EasyPaisa
   number, transaction ID input, screenshot upload (drag-and-drop zone with preview),
   submits to backend.

Build /host/station/new — multi-step animated form (progress bar at top, Framer Motion
slide transition between steps):
  Step 1: basic info (name, address, charger capacity/connector type dropdowns)
  Step 2: pricing (pricePerKwh input with a live "estimated monthly earning" calculator)
  Step 3: location — interactive map, click to drop a pin (use useMapEvents like in
    the reference doc), draggable marker to fine-tune
  Step 4: photo upload (multi-file drag-and-drop, preview grid, max 5)
  Step 5: review & submit — summary card, submit button posts to POST /stations then
    uploads photos to POST /stations/:id/photos
```

### Frontend Phase 5 — Bookings & Chat UI
```
Build /bookings (driver's view): tabs for Upcoming/Past/Cancelled, each booking as a
card with station photo thumbnail, date/time, status badge (color-coded), cancel
button for upcoming ones (confirmation modal before cancelling).

Build /chat/:conversationId:
1. WhatsApp-style chat UI: message bubbles (sent = right, green; received = left, dark
   gray), timestamp on hover, auto-scroll to bottom on new message.
2. Connect to the backend Socket.io gateway on mount (send access token in the `auth`
   handshake), listen for `receiveMessage`/`messageSent`, emit `sendMessage`.
3. Load older history via GET /messages/... with React Query (infinite scroll upward
   using cursor pagination).
4. Show a typing indicator (optional: emit/listen a `typing` event), online/offline
   dot next to the other user's name.
5. Sticky header showing the station name being discussed + a small "Call" icon button
   using the other user's phone number.
```

### Frontend Phase 6 — Admin Panel
```
Build /admin (route-guarded — redirect non-admins away):
1. Dashboard tab: pending stations count, pending subscriptions count, total users
   (as animated stat cards).
2. Stations tab: table/card list of pending stations with photo previews, Approve/Reject
   buttons (reject opens a small reason-input modal), optimistic UI updates.
3. Subscriptions tab: pending proofs with screenshot preview (click to zoom in a modal
   lightbox), Approve/Reject buttons.
4. Users tab: searchable/filterable table (role, verified status), CNIC image preview,
   verify action.
Keep the admin UI simpler/denser than the consumer UI (data-table style, minimal
animation) since this is an internal tool.
```

### Frontend Phase 7 — Polish, Performance & Deployment
```
1. Add page transition animations between routes (Framer Motion AnimatePresence +
   layout animations).
2. Add a global loading bar (top of page) on route/query transitions.
3. Run a Lighthouse pass mentally: lazy-load below-the-fold images (loading="lazy"),
   code-split routes with React.lazy + Suspense, compress/responsive-size all Unsplash
   image URLs (add ?w=... &q=80 params), ensure no layout shift (set width/height or
   aspect-ratio on images).
4. Add a 404 page and a global error boundary with a friendly illustration (lucide icon).
5. Ensure full responsiveness: test breakpoints at 375px, 768px, 1024px, 1440px.
6. Add meta tags / Open Graph tags for the landing page (title, description, og:image
   using the hero Unsplash image) for good link previews when shared.
7. Set up vercel.json / environment variables (VITE_API_URL, VITE_GOOGLE_CLIENT_ID)
   and deploy to Vercel, connecting the backend's CORS FRONTEND_URL to the final
   Vercel domain.
```

---

## PART 6 — Suggested Order of Execution

1. Backend Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 (test each phase with Postman/Thunder
   Client before moving to the next — especially auth and booking race-condition logic).
2. Deploy a working backend to Render early (even before frontend is done) so the
   frontend agent can test against a real API instead of guessing shapes.
3. Frontend Phase 0 → 1 (landing page can be built and reviewed for UI feel even
   before backend is fully ready, since it's mostly static) → 2 → 3 → 4 → 5 → 6 → 7.
4. Final integration pass: run backend locally + frontend locally, click through every
   flow end-to-end (signup → verify email/phone → register station → admin approve →
   search nearby → book → chat → call button → subscription renew → admin approve).

Agar chahein to next message mein hum **Phase 0 ka backend prompt turant expand** kar
ke exact commands + file contents bhi likh sakte hain — bas bata dein kahan se shuru
karna hai.