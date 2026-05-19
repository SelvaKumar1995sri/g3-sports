# Phase 3A: Backend Deployment Design

**Date:** 2026-05-19  
**Status:** Approved  
**Scope:** Deploy NestJS 10 backend to production using Render + Neon + Upstash (free tier)

---

## Goal

Deploy the G3 Sports NestJS backend to a publicly accessible URL with a custom domain, connected to a managed PostgreSQL database and Redis instance — all on free tier — with GitHub-triggered auto-deploys on every push to `main`.

---

## Architecture

```
GitHub (main branch)
    │  push → auto-deploy
    ▼
Render Web Service  ←→  custom domain: api.yourdomain.com (TLS via Let's Encrypt)
    │
    ├─► Neon PostgreSQL  (serverless, free: 0.5 GB, us-east-2)
    └─► Upstash Redis    (serverless, free: 10k cmds/day, 256 MB)
```

**Tech stack:**
- **Compute:** Render Web Service (free tier, Node 20, Oregon us-west-2)
- **Database:** Neon serverless PostgreSQL (free tier)
- **Cache / PubSub:** Upstash Redis (free tier, TLS required)
- **TLS / Domain:** Render built-in Let's Encrypt + custom CNAME
- **CI/CD:** Render GitHub integration (auto-deploy on push to `main`)

---

## Section 1: Render Web Service Configuration

| Setting | Value |
|---|---|
| Environment | Node |
| Region | Oregon (us-west-2) |
| Branch | `main` |
| Root Directory | *(leave blank — commands run from repo root)* |
| Build Command | `pnpm install && cd apps/backend && pnpm build` |
| Start Command | `node apps/backend/dist/main.js` |
| Auto-Deploy | Yes (on every push to `main`) |

**Free tier behaviour:** Service sleeps after 15 minutes of inactivity. First request after sleep triggers a cold start (~30 s). Acceptable for development / early production.

---

## Section 2: Environment Variables

All variables are set in **Render Dashboard → Environment** for the web service. They must never be committed to the repository.

| Variable | Where to get it | Example / Notes |
|---|---|---|
| `NODE_ENV` | Set manually | `production` |
| `PORT` | Set manually | `3000` |
| `DB_HOST` | Neon → Connection Details | `ep-xxx.us-east-2.aws.neon.tech` |
| `DB_PORT` | Neon | `5432` |
| `DB_USER` | Neon | `neondb_owner` |
| `DB_PASS` | Neon | generated secret |
| `DB_NAME` | Neon | `neondb` |
| `DB_SSL` | Set manually | `true` |
| `REDIS_URL` | Upstash → REST / Native Redis URL | `rediss://default:xxx@your-db.upstash.io:6379` |
| `JWT_SECRET` | Generate locally (`openssl rand -hex 32`) | 64-char hex string |
| `JWT_EXPIRES_IN` | Set manually | `7d` |
| `JWT_REFRESH_SECRET` | Generate locally | 64-char hex string |
| `JWT_REFRESH_EXPIRES_IN` | Set manually | `30d` |
| `FIREBASE_PROJECT_ID` | Firebase console → Project Settings | project id string |
| `FIREBASE_PRIVATE_KEY` | Firebase console → Service Account → JSON | full PEM including `\n` |
| `FIREBASE_CLIENT_EMAIL` | Firebase console → Service Account | service account email |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard | cloud name string |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard | numeric key |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard | secret string |
| `ALLOWED_ORIGINS` | Set manually | `https://yourdomain.com,https://admin.yourdomain.com` |

---

## Section 3: Code Changes Required

### 3.1 TypeORM config — add SSL support

**File:** `apps/backend/src/database/database.module.ts` (or wherever `TypeOrmModule.forRootAsync` is configured)

Add SSL option when `DB_SSL=true`:

```typescript
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

Neon requires SSL; `rejectUnauthorized: false` is needed because Neon uses a self-signed-chain cert on the free tier.

### 3.2 Redis provider — use `REDIS_URL`

**File:** `apps/backend/src/modules/score/redis.provider.ts` (or equivalent Redis factory)

Replace separate `REDIS_HOST` / `REDIS_PORT` with:

```typescript
const client = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});
```

Upstash free tier uses `rediss://` (TLS). ioredis accepts a full URL as the first argument.

### 3.3 CORS — restrict origins in production

**File:** `apps/backend/src/main.ts`

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
});
```

### 3.4 `apps/backend/.env.example` — add new vars

Add the following lines so future developers know these vars exist:

```
DB_SSL=false
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## Section 4: TypeORM Schema Strategy (First Production Deploy)

No migrations exist. Strategy: **generate a baseline migration before first deploy.**

### Steps (run locally before pushing to `main`)

1. Create a `data-source.ts` file for the TypeORM CLI:

```typescript
// apps/backend/src/database/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
```

2. Point `.env` at Neon (copy credentials) and generate the migration:

```bash
cd apps/backend
npx typeorm migration:generate src/database/migrations/InitialSchema -d src/database/data-source.ts
```

3. Add `migration:run` to the start sequence. In `apps/backend/package.json`:

```json
"scripts": {
  "migration:run": "typeorm migration:run -d dist/database/data-source.js",
  "start:prod": "node -e \"require('./dist/database/data-source').AppDataSource.initialize().then(ds => ds.runMigrations()).then(() => require('./dist/main'))\"",
}
```

4. Update Render **Start Command** to: `cd apps/backend && node -e "require('./dist/database/data-source').AppDataSource.initialize().then(ds=>ds.runMigrations()).then(()=>require('./dist/main'))"`

5. After confirming tables created on Neon, never set `synchronize: true` in production again. All future schema changes go through `migration:generate` + `migration:run`.

---

## Section 5: Custom Domain on Render

1. Render Dashboard → Web Service → **Custom Domains** → Add `api.yourdomain.com`
2. Render shows a CNAME target: `your-service.onrender.com`
3. DNS provider: add record `CNAME api → your-service.onrender.com` (TTL 300)
4. Wait for DNS propagation (~5–60 min). Render auto-provisions Let's Encrypt TLS.
5. Update frontend environment variables:
   - `apps/web/.env.production`: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
   - `apps/admin/.env.production`: `VITE_API_URL=https://api.yourdomain.com`

---

## Section 6: GitHub → Render Auto-Deploy Setup

1. In Render: **Connect Repository** → authorise GitHub → select `g3-sports` repo
2. Set branch to `main`
3. Auto-Deploy: **Yes**
4. Every `git push origin main` triggers a new Render build + deploy
5. Render shows deploy logs in real time; failed builds do not replace the live service

---

## Out of Scope (Phase 3A)

- Flutter mobile app (Phase 3B)
- Staging environment
- Paid tier upgrades (no sleep, more DB storage)
- CI testing pipeline (GitHub Actions)
- Monitoring / alerting (Sentry, Datadog)
- Database backups beyond Neon's built-in 7-day history

---

## Success Criteria

- `https://api.yourdomain.com/health` returns `200 OK`
- `POST /auth/login` works with a seeded admin user
- All tables exist in Neon (verified via Neon SQL editor)
- Socket.IO connection succeeds from admin app pointed at production URL
- Render auto-redeploys on push to `main`
