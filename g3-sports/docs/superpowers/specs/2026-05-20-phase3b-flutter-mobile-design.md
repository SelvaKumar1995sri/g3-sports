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

### Scorer (Player assigned to a tournament by organizer)
- **My Fixtures** — full fixture list for the tournament I'm assigned to score
- **Start Match Screen** — scorer picks a match from fixtures, then sets:
  - Points per set: **11** or **21**
  - Deuce rule: **Golden Point** (next point wins) or **Standard** (2-point lead required)
  - Taps "Start Match" → match status changes to LIVE
- **Live Scoring Screen** — badminton scorer UI:
  - Current set number, score per team
  - "Win Rally A" button (large, left)
  - "Win Rally B" button (large, right)
  - "Let / Replay" button (center)
  - "Undo" button (bottom)
  - Service indicator (who serves next, auto-tracked)
  - Set summary bar (sets won per team)
  - "End Match" confirmation dialog → confirms winner → match marked COMPLETED
- **Result reflects in fixtures automatically** — bracket/fixture updates when match is COMPLETED

### Organizer (approved by admin)
- **My Tournaments** — list of tournaments I created
- **Create Tournament** — name, sport (Badminton), format, start date, end date, location, **registration deadline**
- **Manage Registrations** — approve/reject team registrations (only open until registration deadline)
- **Generate Fixtures** — available only after registration deadline has passed; triggers bracket generation
- **Assign Scorer** — pick a registered player as scorer for the whole tournament (they score all matches in the fixture)
- **View Bracket** — see fixture progress as matches complete

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

### Tournament & Fixture Flow

```
1. Organizer creates tournament
      → sets name, sport, format, start/end dates, location
      → sets registration deadline date

2. Teams register before deadline
      → organizer approves/rejects registrations

3. Registration deadline passes
      → "Generate Fixtures" button unlocks for organizer
      → organizer generates bracket (POST /brackets/:tournamentId/generate)

4. Organizer assigns scorer
      → picks a registered player as scorer for the whole tournament
      → scorer can now see and start all matches in the fixture

5. Scorer opens "My Fixtures"
      → sees all matches in the bracket (PENDING / LIVE / COMPLETED)
      → picks a PENDING match → taps "Start Match"

6. Start Match — scorer chooses scoring config:
      → Points per set: 11 or 21
      → Deuce rule: Golden Point or Standard
      → Taps confirm → match status → LIVE

7. Scorer records live points rally by rally

8. Match ends → scorer confirms winner
      → match status → COMPLETED
      → result reflected in bracket automatically
      → next round match unlocks (winner advances)
```

### Scoring Configuration (Scorer sets when starting each match)

The scorer picks **two settings** when starting a match from the fixture. Each match can have different settings if needed.

**Setting 1 — Points per set:**
| Option | Description |
|---|---|
| **11 points** | Shorter, faster games |
| **21 points** | Standard BWF format |

**Setting 2 — Deuce rule** (applies when tied at 10-10 or 20-20):
| Option | Description |
|---|---|
| **Golden Point** | The very next point wins the set — sudden death |
| **Standard** | First team to gain a 2-point lead wins the set |

**Examples:**
- `21 pts + Standard` → classic BWF (deuce possible)
- `21 pts + Golden Point` → play to 21, if 20-20 next point wins
- `11 pts + Golden Point` → short format, if 10-10 next point wins
- `11 pts + Standard` → play to 11, if 10-10 first +2 lead wins

**Stored on the match record when started:**
```json
{
  "scoringConfig": {
    "pointsPerSet": 21,
    "deuceRule": "GOLDEN_POINT"
  }
}
```

### Scoring Rules Enforced at Runtime
- Best of 3 sets
- Points per set: from match `scoringConfig.pointsPerSet`
- At tie (10-10 or 20-20): apply `scoringConfig.deuceRule`
  - `GOLDEN_POINT` → next point wins set immediately
  - `STANDARD` → keep playing until one team leads by 2
- Third set: same point target and deuce rule as sets 1 & 2
- Service transfers on every rally win (rally-point scoring)
- Service side auto-tracked and displayed on scorer screen

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

> **Backend changes required:**
> 1. `Tournament` entity + `CreateTournamentDto` — add `registrationDeadline: Date` field. Bracket generation endpoint must reject requests before this date.
> 2. `Match` entity — add `scoringConfig: { pointsPerSet: number, deuceRule: 'GOLDEN_POINT' | 'STANDARD' }` JSON column. Add `PATCH /matches/:id/start` endpoint (scorer sets config, status → LIVE) and `PATCH /matches/:id/complete` endpoint (confirms winner, status → COMPLETED, bracket advances).
> 3. Score service — read `match.scoringConfig` when evaluating set-win and match-win conditions.

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
| Tournaments | `GET /tournaments`, `GET /tournaments/:id`, `POST /tournaments` (organizer — includes `registrationDeadline`) |
| Bracket | `GET /brackets/:tournamentId`, `POST /brackets/:tournamentId/generate` (only after registration deadline) |
| Teams | `GET /teams`, `POST /teams`, `POST /teams/:id/members`, `GET /teams/:id` |
| Matches | `GET /matches`, `GET /matches/:id`, `PATCH /matches/:id/start` (scorer starts with scoringConfig), `PATCH /matches/:id/complete` (scorer confirms winner) |
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
