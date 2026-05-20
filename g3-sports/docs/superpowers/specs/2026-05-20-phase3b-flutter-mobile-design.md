# Phase 3B — Flutter Mobile App Design Spec

## Goal

Build a Flutter mobile app for G3 Sports that supports Firebase OTP authentication, public tournament browsing, live badminton score watching, team management, live scoring for assigned scorers, and a role-upgrade request flow managed through the existing admin panel.

## Architecture

**State management:** Riverpod (`flutter_riverpod`)  
**HTTP client:** Dio with JWT interceptor  
**Real-time:** `socket_io_client` connected to the existing NestJS Socket.IO gateway  
**Auth:** Firebase Auth (phone OTP) → backend JWT via `POST /api/auth/verify-otp`  
**Routing:** `go_router` with role-based guards  
**Token storage:** `flutter_secure_storage`  
**Sport scope at launch:** Badminton (singles + doubles). Cricket and Pickleball added in future phases.

**Tech stack:**
```
firebase_auth          # Phone OTP
flutter_riverpod       # State management
riverpod_annotation    # Code-gen providers
dio                    # HTTP + interceptors
socket_io_client       # Live scores
go_router              # Navigation + guards
flutter_secure_storage # JWT persistence
cached_network_image   # Avatar/logo loading
```

---

## Monorepo Placement

```
g3-sports/
└── apps/
    └── mobile/          # Standalone Flutter project
        ├── lib/
        │   ├── core/
        │   │   ├── api/          # Dio client, base URLs, interceptors
        │   │   ├── auth/         # Firebase + JWT auth service
        │   │   └── socket/       # Socket.IO singleton client
        │   ├── features/
        │   │   ├── auth/         # OTP + profile setup screens + providers
        │   │   ├── tournaments/  # Browse, detail, bracket screens
        │   │   ├── teams/        # Create team, view members, register for tournament
        │   │   ├── matches/      # Match list, match detail
        │   │   ├── scoring/      # Live scorer screen (assigned scorer only)
        │   │   └── profile/      # My profile + role upgrade request
        │   ├── shared/
        │   │   ├── widgets/      # Reusable UI components
        │   │   └── models/       # Shared data models (Tournament, Team, Match, User)
        │   └── main.dart
        ├── pubspec.yaml
        └── google-services.json  # Firebase config (gitignored)
```

Each `features/<name>/` folder contains:
- `screens/` — Flutter screen widgets
- `providers/` — Riverpod providers
- `repositories/` — Dio API calls
- `models/` — Feature-specific data models

---

## User Roles

All registered users are **Players** by default. Scorer and Organizer are permissions layered on top — not separate accounts. A player can organise one tournament and score in another simultaneously.

| Role | How assigned | Capabilities |
|---|---|---|
| **Guest** | Not logged in | Browse tournaments, watch live scores (read-only) |
| **Player** | OTP registration (default) | Guest + create/join team, register team for tournament, view own profile, request organizer upgrade |
| **Scorer** | Owner assigns per match | Player + access live scoring screen for assigned matches |
| **Organizer** | Admin approves upgrade request | Player + create tournaments, manage registrations, schedule matches, assign scorers, generate bracket |
| **Super Admin** | Admin panel only (email/password) | Approve/deny organizer requests, manage all users |

---

## Screen Inventory

### Guest (no login)
- **Home Screen** — list of LIVE and UPCOMING tournaments, search/filter by sport
- **Tournament Detail** — bracket, registered teams, match schedule
- **Live Match Spectator** — real-time badminton score (read-only, Socket.IO)
- **Player Profile** — public profile: display name, tournament history, team memberships
- **Sign In Screen** — phone number entry → OTP screen

### Player (all registered users, layered on Guest)
- **OTP Screen** — 6-digit Firebase OTP entry
- **Profile Setup** — first-login only: display name (username suggestions from backend)
- **My Team** — view my team, members, upcoming matches
- **Create Team** — team name, sport, optional logo
- **Tournament Registration** — register my team for an open tournament
- **My Profile** — own public profile + "Request Organizer Access" button
- **Role Upgrade Request Screen** — submit request with reason, view current status (pending/approved/denied)

### Scorer (Player assigned to a match)
- **My Assigned Matches** — list of matches I'm scoring today
- **Live Scoring Screen** — badminton scorer UI:
  - Current set number, score per team
  - "Win Rally A" button (large, left)
  - "Win Rally B" button (large, right)
  - "Let / Replay" button (center)
  - "Undo" button (bottom)
  - Service indicator (who serves next, auto-tracked)
  - Set summary bar (sets won per team)
  - "End Match" confirmation dialog

### Organizer (approved by admin)
- **My Tournaments** — list of tournaments I created
- **Create Tournament** — name, sport (Badminton), format, dates, location
- **Manage Registrations** — approve/reject team registrations
- **Schedule Matches** — assign teams to match slots, set time/ground
- **Assign Scorer** — pick a registered player to score a specific match
- **Generate Bracket** — trigger bracket generation via backend API

---

## Authentication Flow

```
App Launch
  ├── No JWT stored → Home Screen (Guest mode)
  │     └── "Sign In" → Phone Entry Screen
  │           └── Firebase SMS OTP → OTP Entry Screen
  │                 └── Firebase verifies → idToken
  │                       └── POST /api/auth/verify-otp { idToken, phone }
  │                             ├── New user → Profile Setup Screen → Player Home
  │                             └── Existing user → role-based redirect
  │
  └── JWT stored → validate (check expiry / 401 probe)
        ├── Valid → role-based home screen
        └── Invalid → clear token → Guest Home
```

**Role-based redirect after login:**
- `SUPER_ADMIN` → Admin Panel (web only, not in mobile app)
- `ORGANIZER` → My Tournaments screen
- `PLAYER` with scorer assignment today → Assigned Matches screen
- `PLAYER` → My Team / Home Screen

**Token lifecycle:**
- JWT stored in `flutter_secure_storage`
- Dio interceptor attaches `Authorization: Bearer <token>` to every request
- On 401 response → clear token → navigate to Sign In

---

## Role Upgrade Request Flow

### Mobile App
1. Player opens My Profile → taps "Request Organizer Access"
2. Form: optional reason text → submit → `POST /api/users/role-requests { reason }`
3. Status shown on profile: `PENDING` / `APPROVED` / `DENIED`
4. If approved → app re-fetches user profile → Organizer features unlock

### Admin Panel (new screen)
- New "Role Requests" tab in the existing admin web app (`apps/admin`)
- Table: player name, phone, submitted date, reason, status
- Actions: **Approve** (`PATCH /api/admin/role-requests/:id { action: 'approve' }`) or **Deny** (`PATCH /api/admin/role-requests/:id { action: 'deny' }`)
- Approving changes user's role to `ORGANIZER` in the DB

### Backend (new endpoints needed)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/users/role-requests` | Player JWT | Submit upgrade request |
| `GET` | `/api/admin/role-requests` | Admin JWT | List all requests |
| `PATCH` | `/api/admin/role-requests/:id` | Admin JWT | Approve or deny |

New DB table: `role_request` — columns: `id`, `userId`, `reason`, `status` (PENDING/APPROVED/DENIED), `createdAt`, `reviewedAt`.

---

## Live Scoring — Badminton

### Scoring Rules Enforced
- Best of 3 sets, 21 points per set
- At 20-20: play until 2-point lead (deuce)
- Max 30 points per set (30-29 wins)
- Third set played to 15 points
- Service transfers on rally win (rally-point scoring)
- Service side tracked and shown on scorer screen

### Socket.IO Integration
```
Spectator joins:  socket.emit('joinRoom', matchId)
Score update:     socket.on('scoreUpdate', (data) => updateUI(data))
Spectator leaves: socket.emit('leaveRoom', matchId)

Scorer action → POST /api/score/badminton/point
Backend saves → emits 'scoreUpdate' to room
All spectators receive update < 1 second
```

### Badminton Point DTO (existing backend)
```json
{
  "matchId": "uuid",
  "teamId": "uuid-of-winning-team",
  "isLet": false
}
```

Undo: `DELETE /api/score/badminton/:matchId/undo`

---

## Data Flow Summary

```
Repository (Dio) → Provider (Riverpod) → Screen (Flutter Widget)
                                ↑
                    Socket.IO client (live updates)
                    pushes into StreamProvider
```

- REST calls for all CRUD (tournaments, teams, matches, profiles)
- Socket.IO `StreamProvider` for live score updates only
- `StateNotifierProvider` for scorer actions (optimistic UI + API call)
- Offline: Socket.IO auto-reconnects; banner shown during disconnection; scoring blocked offline

---

## Backend API Surface Used

| Feature | Endpoints |
|---|---|
| Auth | `POST /auth/verify-otp`, `POST /auth/check-username`, `POST /auth/suggest-usernames` |
| Tournaments | `GET /tournaments`, `GET /tournaments/:id`, `POST /tournaments` (organizer) |
| Bracket | `GET /brackets/:tournamentId`, `POST /brackets/:tournamentId/generate` |
| Teams | `GET /teams`, `POST /teams`, `POST /teams/:id/members`, `GET /teams/:id` |
| Matches | `GET /matches`, `GET /matches/:id`, `POST /matches`, `PATCH /matches/:id/toss` |
| Scoring | `GET /score/badminton/:matchId`, `POST /score/badminton/point`, `DELETE /score/badminton/:matchId/undo` |
| Users | `GET /users/:id` (public profile), `POST /users/role-requests` (new) |
| Admin | `GET /admin/role-requests` (new), `PATCH /admin/role-requests/:id` (new) |
| Socket.IO | `joinRoom`, `leaveRoom`, `scoreUpdate` event |

---

## What Is NOT in Scope (Phase 3B)

- Push notifications (FCM) — future phase
- Cricket and Pickleball scoring — future phase
- In-app chat — future phase
- Payment / entry fees — future phase
- Dark/light theme toggle — dark only at launch
- Tablet layout — phone only at launch
