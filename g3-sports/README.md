# G3 Sports — Tournament Management Platform

A full-stack sports tournament management platform with a Flutter mobile app, React admin dashboard, Next.js marketing site, and NestJS backend API.

---

## 🔗 Live Links

| Service | URL |
|---|---|
| **Backend API** | https://g3-sports-backend.onrender.com/api |
| **Admin Dashboard** | https://g3-sports-admin.vercel.app |
| **Marketing Website** | https://g3-sports-web.vercel.app *(if deployed)* |
| **Firebase Console** | https://console.firebase.google.com/project/g3-sports-mobile |
| **Neon (PostgreSQL)** | https://console.neon.tech |
| **Upstash (Redis)** | https://console.upstash.com |
| **Render (Backend host)** | https://dashboard.render.com |

---

## 🏗️ Architecture

```
g3-sports/
├── apps/
│   ├── backend/        → NestJS REST API + WebSocket gateway
│   ├── admin/          → React + Vite admin dashboard
│   ├── web/            → Next.js marketing & landing site
│   └── mobile/         → Flutter Android/iOS mobile app
└── packages/
    └── types/          → Shared TypeScript types (UserRole, etc.)
```

### How the pieces connect

```
┌─────────────────┐        HTTPS/REST        ┌──────────────────────────┐
│  Flutter App    │ ◄──────────────────────► │  NestJS Backend API      │
│  (Android/iOS)  │        WebSocket         │  (Render)                │
└─────────────────┘                          └──────────────┬───────────┘
                                                            │
┌─────────────────┐        HTTPS/REST        │         ┌───▼──────────┐
│  Admin Panel    │ ◄──────────────────────► │         │  PostgreSQL  │
│  (React/Vite)   │                          │         │  (Neon)      │
└─────────────────┘                          │         └──────────────┘
                                             │         ┌──────────────┐
┌─────────────────┐                          │         │  Redis       │
│  Marketing Web  │                          └────────►│  (Upstash)   │
│  (Next.js)      │                                    └──────────────┘
└─────────────────┘

Firebase Phone Auth ──► Mobile OTP verification ──► Backend JWT issuance
```

---

## 🛠️ Tech Stack

### Backend (`apps/backend`)
- **Framework:** NestJS 10 (Node.js)
- **Database:** PostgreSQL via TypeORM (hosted on Neon)
- **Cache / Real-time:** Redis via ioredis (hosted on Upstash, TLS)
- **Auth:** Firebase Admin SDK (phone OTP verification) + JWT (access + refresh tokens)
- **WebSockets:** Socket.IO gateway for live scoring
- **File uploads:** Cloudinary
- **Rate limiting:** @nestjs/throttler
- **Deployment:** Render (Web Service)

### Mobile App (`apps/mobile`)
- **Framework:** Flutter 3 / Dart
- **State management:** Riverpod (flutter_riverpod)
- **Navigation:** GoRouter
- **HTTP client:** Dio (with auth interceptor for JWT)
- **Auth:** Firebase Phone Authentication (native Android/iOS OTP)
- **Min Android SDK:** 23 (Android 6.0 Marshmallow)

### Admin Dashboard (`apps/admin`)
- **Framework:** React 18 + Vite
- **Data fetching:** TanStack Query (React Query v5)
- **HTTP:** Axios
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Deployment:** Vercel

### Marketing Website (`apps/web`)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 👥 User Roles

| Role | Access |
|---|---|
| `player` | Browse tournaments, join teams, view scores, request organizer role |
| `organizer` | Create & manage tournaments, manage teams |
| `scorer` | Enter live scores during matches |
| `super_admin` | Full access — manage all users, approve role requests, system settings |

---

## 📱 Mobile App — Player Flow

1. **Phone number entry** → Firebase sends OTP SMS
2. **OTP verification** → Backend issues JWT tokens
3. **Profile setup** (new users) → Set display name + unique username
4. **Home** → Browse upcoming tournaments
5. **My Profile** → View stats, request organizer access, check request status

### Username validation
- Real-time availability check while typing (600ms debounce)
- Calls `GET /api/auth/check-username?username=<value>`
- If taken, fetches suggestions via `GET /api/auth/suggest-usernames?base=<value>`
- ✅ green border = available, ❌ red border = taken, suggestion chips to auto-fill

---

## 🖥️ Admin Dashboard — Features

- **Login:** Email + password (`POST /api/auth/admin/login`)
- **Users page:** List all users, change roles via dropdown
- **Tournaments:** Create, edit, manage bracket/group tournaments
- **Role Requests:** Approve or deny organizer role requests from players
- **Live Scores:** Monitor real-time match scores

### First-time admin setup
```
POST /api/auth/admin/setup
{ "email": "admin@example.com", "password": "...", "fullName": "Admin" }
```
This endpoint is blocked once any super_admin exists.

---

## ⚙️ Backend API Reference

Base URL: `https://g3-sports-backend.onrender.com/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/admin/setup` | Create first super_admin (one-time) |
| POST | `/auth/admin/login` | Admin login → access_token |
| POST | `/auth/verify-otp` | Verify Firebase OTP → JWT tokens |
| GET | `/auth/check-username?username=` | Check username availability |
| GET | `/auth/suggest-usernames?base=` | Get 3 username suggestions |
| POST | `/auth/refresh-token` | Refresh JWT (requires auth) |
| POST | `/auth/logout` | Logout (stateless — client drops token) |

### Users (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update profile (fullName, username, avatar) |
| POST | `/users/role-requests` | Request organizer role |
| GET | `/users/role-requests/mine` | Check my request status |
| GET | `/users` | *(super_admin)* List all users |
| PATCH | `/users/:id/role` | *(super_admin)* Change user role |
| GET | `/users/role-requests` | *(super_admin)* List all requests |
| PATCH | `/users/role-requests/:id` | *(super_admin)* Approve/deny request |

### Response format
All responses are wrapped:
```json
{ "data": { ... }, "timestamp": "2026-05-21T..." }
```

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Flutter SDK ≥ 3.19
- Android Studio (for mobile emulator)
- Firebase project with Phone Auth enabled

### 1. Clone & install
```bash
git clone <repo-url>
cd g3-sports
pnpm install
```

### 2. Backend setup
```bash
cd apps/backend
cp .env.example .env
# Fill in your credentials (see Environment Variables section below)
pnpm run dev
# Runs on http://localhost:3001
```

### 3. Admin dashboard setup
```bash
cd apps/admin
pnpm run dev
# Runs on http://localhost:5173
```

### 4. Marketing website setup
```bash
cd apps/web
pnpm run dev
# Runs on http://localhost:3000
```

### 5. Flutter mobile app setup
```bash
cd apps/mobile
flutter pub get

# Configure Firebase (run once)
flutterfire configure --platforms=android,ios,web

# Run on Android emulator or device
flutter run -d <device-id>

# Build debug APK
flutter build apk --debug
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

---

## 🌍 Environment Variables

### Backend (`apps/backend/.env`)

```env
# Database (Neon PostgreSQL)
DB_HOST=<your-neon-host>.neon.tech
DB_PORT=5432
DB_USERNAME=<username>
DB_PASSWORD=<password>
DB_NAME=<database>
DB_SSL=true
DB_SYNC=false    # Set to true only to auto-create tables in dev

# Redis (Upstash)
REDIS_HOST=<your-upstash-host>.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_TLS=true

# JWT
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<another-random-64-char-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"

# Cloudinary (for photo uploads)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# App
PORT=3001
NODE_ENV=development
```

### Mobile App (`apps/mobile`)
Firebase config is stored in:
- `lib/firebase_options.dart` — auto-generated by FlutterFire CLI
- `android/app/google-services.json` — Android Firebase config

The backend URL is set in `lib/core/api/api_client.dart`:
```dart
const _baseUrl = 'https://g3-sports-backend.onrender.com/api';
```
For local development, change to your PC's network IP: `http://192.168.x.x:3001/api`

---

## 📲 Install the Android APK

1. Build the APK:
   ```bash
   cd apps/mobile
   flutter build apk --debug
   ```
2. Copy `build/app/outputs/flutter-apk/app-debug.apk` to your Android device
3. On the device: Settings → Security → Allow installation from unknown sources
4. Tap the APK file to install

> **Note:** iOS requires a Mac with Xcode and an Apple Developer account. The APK only works on Android.

---

## 🔐 Firebase Phone Auth Notes

- **Android/iOS:** Uses native Firebase SDK — OTP delivered via SMS automatically
- **Web:** Phone auth on web requires a different flow (reCAPTCHA). The mobile app shows an error on web and directs users to use the Android/iOS app.
- **Test phone numbers:** Add test numbers in Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers (e.g., `+91 8015569162` → OTP `123456`)

---

## 🗄️ Database Notes

- Hosted on **Neon** (serverless PostgreSQL)
- `synchronize: false` in production — schema changes must be applied manually via SQL or by temporarily setting `DB_SYNC=true` in the environment
- Important tables: `user`, `tournament`, `team`, `match`, `role_request`, `cricket_score`, `badminton_score`, `pickleball_score`, `player_stat`

### Create `role_request` table manually (if needed)
```sql
CREATE TABLE IF NOT EXISTS role_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR DEFAULT 'pending',
  "reviewedBy" UUID REFERENCES "user"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Deployment

### Backend (Render)
- **Build command:** `pnpm install && pnpm run build`
- **Start command:** `node dist/main.js`
- **Root directory:** `apps/backend`
- Set all environment variables in Render dashboard → Environment tab
- Auto-deploys on push to `main`

### Admin Panel (Vercel)
- **Framework:** Vite
- **Root directory:** `apps/admin`
- **Build command:** `pnpm run build`
- **Output directory:** `dist`
- Set `VITE_API_URL=https://g3-sports-backend.onrender.com/api`

### Marketing Website (Vercel)
- **Framework:** Next.js
- **Root directory:** `apps/web`
- Auto-detected by Vercel

---

## 📁 Key File Locations

| File | Purpose |
|---|---|
| `apps/backend/src/main.ts` | NestJS app bootstrap, global pipes/filters |
| `apps/backend/src/modules/auth/auth.service.ts` | OTP verify, JWT issue, username logic |
| `apps/backend/src/modules/users/users.service.ts` | Profile, role requests, user management |
| `apps/backend/src/modules/gateway/score.gateway.ts` | WebSocket live scoring |
| `apps/mobile/lib/core/api/api_client.dart` | Dio HTTP client + auth interceptor |
| `apps/mobile/lib/core/auth/auth_service.dart` | Firebase OTP + backend JWT flow |
| `apps/mobile/lib/features/auth/providers/auth_provider.dart` | Riverpod auth state |
| `apps/mobile/lib/features/auth/screens/otp_screen.dart` | OTP entry screen |
| `apps/mobile/lib/features/auth/screens/profile_setup_screen.dart` | Username + name setup |
| `apps/admin/src/pages/UsersPage.tsx` | User list + role management |
| `apps/admin/src/api/users.ts` | Admin API calls |

---

## 🧑‍💻 Development Team

- **Project:** G4 SportsForce / G3 Sports
- **Developer:** Selva Kumar (selvakumar.s@sixredmarbles.in)

---

*Built with ❤️ using Flutter, NestJS, React, and Firebase*
