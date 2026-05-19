# G3 Sports — Master Design Specification
**Date:** 2026-05-18  
**Status:** Approved  
**Version:** 1.0

---

## 1. Project Overview

G3 Sports is a production-ready, multi-platform sports management ecosystem that enables tournament organizers, academy owners, coaches, and players to manage, score, and follow sports tournaments in real time.

### 1.1 Application Name & Brand
- **Name:** G3 Sports
- **Tagline:** Play. Score. Dominate.
- **Brand Direction:** Electric Night
  - Background: `#0A0E1A` (deep navy/black)
  - Primary / Cyan: `#00E5FF`
  - Accent / Lime: `#CCFF00`
  - Highlight / Pink: `#FF4D6D`
  - Card surface: `#111827`
  - Muted text: `#6B7280`
- **Typography:** Inter — headings weight 900, body weight 400/500
- **Animations:** Framer Motion (web), Flutter built-in animations (mobile)

### 1.2 Supported Sports
- Cricket
- Shuttle Badminton
- Pickleball
- Architecture supports future sport additions via configurable rules engine

### 1.3 Platforms
| Platform | Technology |
|----------|-----------|
| Android App | Flutter 3 |
| iOS App | Flutter 3 |
| Marketing Website | Next.js 14 |
| Admin Dashboard | React + Vite |
| Backend API | NestJS |

---

## 2. Core Business Requirements

### 2.1 Multi-Ground Simultaneous Match Management
A single organizer/academy owner can:
- Own and manage multiple grounds/courts
- Schedule overlapping matches across different grounds
- Assign individual scorers per ground
- Run different sports simultaneously

**Example scenario:**
- Ground A → Cricket Match (live)
- Ground B → Cricket Match (live)
- Court 1 → Shuttle Badminton (live)
- Court 2 → Pickleball (live)

Each match runs with:
- Independent Socket.IO room (`match:{id}`)
- Separate live score stream
- Dedicated scorer
- Unique statistics
- Independent notifications

### 2.2 User Roles
| Role | Key Permissions |
|------|----------------|
| **Super Admin** | All — manage users, view analytics, configure sports rules, monitor all matches |
| **Tournament Organizer** | Create tournaments, manage grounds, assign scorers, schedule matches, manage teams |
| **Academy Owner** | Manage academy grounds, host tournaments, add coaches/players |
| **Coach** | Manage players, track stats, view performance, participate in tournaments |
| **Player/User** | Register, join tournaments, view scores, track history, view rankings |

---

## 3. Architecture

### 3.1 Approach
**Monorepo** using Turborepo + pnpm workspaces. All platforms in one repository with shared TypeScript types.

### 3.2 Monorepo Structure
```
g3-sports/
├── apps/
│   ├── backend/        # NestJS + PostgreSQL + Socket.IO
│   ├── web/            # Next.js 14 — marketing site
│   ├── admin/          # React + Vite — admin dashboard
│   └── mobile/         # Flutter 3 — Android + iOS
├── packages/
│   ├── types/          # Shared TypeScript types (API contracts)
│   ├── ui/             # Shared web UI components
│   └── config/         # Shared ESLint + TSConfig
├── turbo.json
└── package.json
```

### 3.3 System Layers

**Client Layer** (4 clients → REST + WebSocket)
- Flutter app (Android + iOS) — Riverpod state management, GoRouter navigation
- Next.js marketing site — Framer Motion + GSAP animations
- React admin dashboard — Recharts analytics, TanStack Query
- Public scoreboard page (Next.js) — TV/projector fullscreen view

**API Layer** (NestJS)
- Auth Module — OTP, JWT, RBAC
- Tournament Module — brackets, rounds, draws, standings
- Grounds Module — multi-ground, scheduling, conflict detection
- Score Engine — Cricket, Badminton, Pickleball scoring logic
- Analytics Module — stats, reports, activity tracking
- Notifications Module — FCM push, Socket.IO events

**Data Layer**
- PostgreSQL — primary database (users, matches, scores, tournaments)
- Redis — live score cache, Socket.IO room registry, session store
- Cloudinary — team logos, banners, profile pictures (PNG/JPG/WEBP)
- Firebase — OTP authentication + FCM push notifications

**Infrastructure**
- Vercel — marketing site + admin dashboard
- Railway / AWS — NestJS backend + Redis
- Turborepo — monorepo build orchestration
- GitHub Actions — CI/CD pipeline

### 3.4 Real-Time Architecture
- Each match has a unique Socket.IO room: `match:{match_id}`
- Scorers emit score events to their match room
- All spectators in the room receive updates instantly
- Redis caches current match state — no DB query on every score update
- DB write happens async after each scoring action (non-blocking)

---

## 4. Database Schema

**14 tables across 5 domains — PostgreSQL**

### 4.1 Users & Auth
```sql
users
  id uuid PK
  phone varchar UNIQUE INDEX
  username varchar UNIQUE INDEX
  full_name varchar
  avatar_url text
  role enum(super_admin, organizer, academy_owner, coach, player)
  is_active boolean
  firebase_uid varchar UNIQUE
  created_at timestamp

user_profiles
  id uuid PK
  user_id uuid FK → users
  bio text
  city varchar
  preferred_sport enum(cricket, badminton, pickleball)
  jersey_number int
  batting_style varchar
  device_tokens text[]   -- FCM tokens array
```

### 4.2 Tournaments & Grounds
```sql
tournaments
  id uuid PK
  organizer_id uuid FK → users
  name varchar
  sport enum(cricket, badminton, pickleball)
  format enum(knockout, league, group_knockout, round_robin)
  status enum(draft, registration, active, completed, cancelled)
  banner_url text
  start_date date
  end_date date
  rules_config jsonb    -- configurable sport rules, admin-editable
  created_at timestamp

grounds
  id uuid PK
  owner_id uuid FK → users
  tournament_id uuid FK → tournaments (nullable — grounds can pre-exist)
  name varchar
  sport_type enum
  capacity int
  is_available boolean

tournament_teams
  id uuid PK
  tournament_id uuid FK → tournaments
  team_id uuid FK → teams
  group_name varchar     -- for group stage tournaments
  seed int
  is_eliminated boolean
  elimination_round varchar
```

### 4.3 Teams & Players
```sql
teams
  id uuid PK
  owner_id uuid FK → users
  name varchar INDEX
  logo_url text
  banner_url text
  theme_color varchar    -- hex color for team identity
  sport enum
  captain_id uuid FK → users
  nickname varchar
  description text
  sponsor_info jsonb     -- {name, logo_url, website}

team_members
  id uuid PK
  team_id uuid FK → teams
  user_id uuid FK → users
  role enum(captain, vice_captain, player, substitute)
  jersey_number int
  is_active boolean
  joined_at timestamp
```

### 4.4 Matches & Live Scoring
```sql
matches
  id uuid PK
  tournament_id uuid FK → tournaments
  ground_id uuid FK → grounds
  team_a_id uuid FK → teams
  team_b_id uuid FK → teams
  scorer_id uuid FK → users
  sport enum
  status enum(scheduled, toss, live, paused, completed, abandoned)
  round varchar          -- QF, SF, Final, Group A, etc.
  winner_id uuid FK → teams (nullable until completed)
  scheduled_at timestamp
  started_at timestamp
  completed_at timestamp
  socket_room varchar    -- "match:{id}" — unique Socket.IO room

cricket_scores
  id uuid PK
  match_id uuid FK → matches
  team_id uuid FK → teams
  innings int            -- 1 or 2
  runs int
  wickets int
  overs decimal          -- e.g. 16.2
  extras jsonb           -- {wides, no_balls, byes, leg_byes}
  over_history jsonb     -- array of ball-by-ball events

badminton_scores
  id uuid PK
  match_id uuid FK → matches
  set_number int
  team_a_points int
  team_b_points int
  server_id uuid FK → users
  set_winner_id uuid FK → teams
  is_completed boolean

pickleball_scores
  id uuid PK
  match_id uuid FK → matches
  game_number int
  team_a_points int
  team_b_points int
  serving_team_id uuid FK → teams
  serve_number int       -- 1 or 2 (doubles)
  game_winner_id uuid FK → teams
  is_completed boolean
```

### 4.5 Analytics, Notifications & Brackets
```sql
player_stats
  id uuid PK
  player_id uuid FK → users
  match_id uuid FK → matches
  team_id uuid FK → teams
  sport enum
  stats_data jsonb       -- flexible schema per sport

notifications
  id uuid PK
  user_id uuid FK → users
  type enum(match_start, score_update, tournament_alert, admin_alert)
  title varchar
  body text
  is_read boolean
  meta jsonb             -- {match_id, tournament_id, etc.}
  created_at timestamp

bracket_matches
  id uuid PK
  tournament_id uuid FK → tournaments
  match_id uuid FK → matches
  round varchar
  position int           -- position in bracket (1-indexed per round)
  next_match_id uuid FK → bracket_matches (self-ref — winner flows here)
```

**Key design decisions:**
- `rules_config JSONB` → admins configure sport rules without schema migrations
- `socket_room` on matches → enables independent simultaneous match streams
- `player_stats.stats_data JSONB` → one table works across all sports
- `bracket_matches.next_match_id` self-references → bracket auto-advances on match completion

---

## 5. API Modules

### 5.1 Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-otp` | — | Send OTP via Firebase |
| POST | `/verify-otp` | — | Verify OTP, issue JWT |
| POST | `/check-username` | — | Real-time username availability |
| POST | `/suggest-usernames` | — | Auto-suggest 2 unique usernames |
| POST | `/refresh-token` | JWT | Refresh access token |
| POST | `/logout` | JWT | Revoke session |

### 5.2 Tournaments — `/api/tournaments`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List tournaments (sport/status filters) |
| POST | `/` | ORG | Create tournament |
| GET | `/:id` | — | Tournament detail |
| PUT | `/:id` | ORG | Update tournament |
| GET | `/:id/bracket` | — | Full bracket tree |
| POST | `/:id/generate-bracket` | ORG | Auto-generate bracket from teams |
| POST | `/:id/teams` | ORG | Add team to tournament |
| GET | `/:id/standings` | — | Points table / league standings |
| GET | `/:id/qr` | — | Generate QR code for tournament join |
| POST | `/:id/join` | JWT | Join tournament via QR or link |

### 5.3 Grounds — `/api/grounds`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ORG | Create ground/court |
| GET | `/my-grounds` | ORG | Owner's grounds list |
| GET | `/:id/schedule` | — | Ground match calendar |
| GET | `/:id/live` | — | Current live match on this ground |

### 5.4 Matches — `/api/matches`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ORG | Schedule match |
| GET | `/live` | — | All currently live matches |
| GET | `/:id` | — | Match detail + current scores |
| PATCH | `/:id/status` | SCORER | Start / pause / end match |
| POST | `/:id/toss` | SCORER | Record toss result |
| POST | `/:id/score` | SCORER | Record ball / point / rally |
| POST | `/:id/score/undo` | SCORER | Undo last scoring action |
| PATCH | `/:id/scorer` | ORG | Assign scorer to match |
| **WS** | `match:{id}` | — | Real-time score room (Socket.IO) |

### 5.5 Teams — `/api/teams`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Create team |
| GET | `/:id` | — | Team profile + career stats |
| PUT | `/:id/branding` | OWNER | Update logo / banner / theme color |
| POST | `/:id/members` | OWNER | Add player to team roster |
| GET | `/:id/stats` | — | Team career statistics |

### 5.6 Analytics — `/api/analytics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | ADMIN | Super admin overview metrics |
| GET | `/player/:id` | JWT | Player career stats (all sports) |
| GET | `/tournament/:id` | — | Tournament analytics |
| GET | `/leaderboard` | — | Global player rankings |

---

## 6. Flutter App — Screen Map

### Onboarding Flow
- Splash Screen (brand animation)
- Phone Entry (OTP trigger)
- OTP Verification (6-digit, auto-read SMS)
- Create Username (real-time availability check + 2 auto-suggestions)
- Select Role (Player / Coach / Organizer)
- Sport Preference Selection

### Tab 1 — Home
- Home Feed (live matches, upcoming, news)
- Search (teams, players, tournaments)
- Notifications

### Tab 2 — Live Matches
- Live Matches List (all grounds, filter by sport)
- Match Scoreboard (Team Card View, real-time)
- Ball-by-Ball Timeline Feed
- Match Stats (batting, bowling, sets)
- Public Scoreboard (TV/projector fullscreen mode)

### Tab 3 — Score (Center FAB — Scorer role only)
- My Assigned Matches
- Toss Screen (coin toss, team choice)
- Cricket Scorer (runs, wickets, extras, over-by-over)
- Badminton Scorer (rally, set tracking, server)
- Pickleball Scorer (points, serve number, games)
- Undo / Edit Last Play

### Tab 4 — Tournaments
- Tournament List (browse, filter, search)
- Tournament Detail (info, teams, schedule)
- Bracket View (classic tree, zoomable, real-time)
- Points Table (league standings)
- Create Tournament (Organizer only)
- Manage Grounds (Organizer — assign scorers)
- QR Code Join (scan to join tournament)

### Tab 5 — Profile
- My Profile (stats, history, trophies)
- My Teams (manage team, branding)
- Team Branding (logo, banner, theme color upload)
- Match History
- Career Stats (per sport)
- Leaderboard (global rankings)
- Settings (dark/light mode, notifications, account)

---

## 7. Marketing Website

### Pages
1. **Home** — Video/particle animated hero, dual iOS + Android download CTAs, sport feature cards, testimonials
2. **Features** — Multi-ground support, simultaneous match handling, live scoring, real-time updates, analytics, tournament management
3. **Contact** — Contact form, email support, social media links, business inquiries

### Design Requirements
- Video/particle animated hero section (GSAP / Three.js particles)
- Framer Motion scroll animations on all sections
- Electric Night color theme throughout
- Mobile responsive — all breakpoints
- Dual App Store + Play Store download buttons prominent
- Admin login link in footer (protected route → admin dashboard)
- Fast load — Next.js static generation where possible

---

## 8. Admin Dashboard

### Sections
- **Analytics Overview** — active users, daily usage, match counts, live matches, sport popularity, peak times
- **User Management** — add/remove/suspend users, assign roles, monitor activity
- **Tournament Monitor** — live tournament view, simultaneous match panel, suspicious activity
- **Ground Analytics** — ground usage stats, availability calendar
- **Sports Rules Configurator** — edit rules_config per sport without code changes
- **Reports** — export CSV/PDF for tournaments, players, usage

### Auth
- Separate login page at `/admin/login`
- JWT-protected routes
- Role check: `super_admin` only

---

## 9. Real-Time & Notifications

### Socket.IO Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `join_match` | Client → Server | `{ match_id }` |
| `score_update` | Server → Client | Full match state |
| `match_status` | Server → Client | `{ status, match_id }` |
| `bracket_update` | Server → Client | Updated bracket node |
| `wicket` | Server → Client | `{ player, type, over }` |

### Push Notifications (FCM)
- Match start reminder (15 min before)
- Live score milestone alerts
- Tournament bracket advancement
- Admin alerts for suspicious activity

---

## 10. Security

- Firebase OTP → JWT (access + refresh token pair)
- RBAC guards on all protected NestJS routes
- Bcrypt for any stored secrets
- API rate limiting (NestJS Throttler)
- Helmet.js HTTP security headers
- Input validation — class-validator on all DTOs
- Cloudinary signed uploads (no direct client write)
- Socket.IO rooms authenticated via JWT on connection

---

## 11. Build Roadmap

### Phase 1 — Foundation (Weeks 1–4)
**Backend:** Monorepo setup, PostgreSQL schema, Firebase OTP → JWT, RBAC, username check/suggest, Redis + Socket.IO gateway, User/Profile CRUD, Cloudinary upload  
**Marketing Site:** G3 Sports brand + design system, all 3 pages, Framer Motion animations, deploy to Vercel

### Phase 2 — Admin & Tournament Engine (Weeks 5–8)
**Backend:** Tournament CRUD + bracket generation, grounds API, match scheduling + conflict detection, teams + branding API, scorer assignment, FCM notifications  
**Admin Dashboard:** Login, analytics dashboard, user management, live match monitor, tournament bracket view, ground stats, sports rules configurator, CSV/PDF export

### Phase 3 — Flutter Mobile App (Weeks 9–13)
**Core:** Riverpod + GoRouter setup, OTP onboarding, bottom tab shell, home feed, tournament list + bracket, team branding upload, player profile, FCM  
**Live Scoring:** Socket.IO client, Cricket/Badminton/Pickleball scorer UIs, live scoreboard, ball-by-ball feed, undo action, offline sync queue

### Phase 4 — Polish & Launch (Weeks 14–16)
Player/team career stats, leaderboard, dark/light mode, QR tournament join, TV scoreboard page, App Store + Play Store submission, rate limiting, security audit, load testing

---

## 12. Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | Flutter | 3.x |
| State management | Riverpod | 2.x |
| Mobile routing | GoRouter | Latest |
| Marketing site | Next.js | 14.x |
| Web animations | Framer Motion + GSAP | Latest |
| Admin dashboard | React + Vite | 18.x / 5.x |
| Admin charts | Recharts | Latest |
| Admin data fetching | TanStack Query | v5 |
| Backend framework | NestJS | 10.x |
| ORM | TypeORM | Latest |
| Real-time | Socket.IO | 4.x |
| Primary database | PostgreSQL | 15+ |
| Cache / sessions | Redis | 7.x |
| OTP + Push | Firebase (Auth + FCM) | Latest |
| Media storage | Cloudinary | Latest |
| Monorepo | Turborepo + pnpm | Latest |
| Web hosting | Vercel | — |
| API hosting | Railway or AWS ECS | — |
| CI/CD | GitHub Actions | — |

---

## 13. Future Scope (Post-Launch)

- AI match analytics and predictions
- Video highlights generation
- Subscription / monetization plans
- Advertisement system
- Multi-language support
- Smart team balancing algorithm
- Wearable device integration
- Auto bracket generation with AI seeding
