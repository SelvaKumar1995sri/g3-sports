# G3 Sports Phase 1 — Monorepo + Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Turborepo monorepo, implement the full NestJS backend with PostgreSQL + Redis + Socket.IO + Firebase OTP auth, and deploy a working API.

**Architecture:** pnpm workspaces + Turborepo monorepo. NestJS with TypeORM for PostgreSQL, ioredis for cache, @nestjs/platform-socket.io for real-time. Firebase Admin SDK verifies OTPs, issues JWT access + refresh tokens. RBAC via custom NestJS guards.

**Tech Stack:** Node.js 20, pnpm 9, Turborepo 2, NestJS 10, TypeORM 0.3, PostgreSQL 15, Redis 7, Socket.IO 4, Firebase Admin, Cloudinary SDK, class-validator, @nestjs/jwt, @nestjs/throttler, Helmet

---

## File Map

```
g3-sports/
├── turbo.json
├── package.json                          # pnpm workspace root
├── pnpm-workspace.yaml
├── packages/
│   ├── types/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── user.types.ts
│   │       ├── tournament.types.ts
│   │       ├── match.types.ts
│   │       └── socket.types.ts
│   └── config/
│       ├── package.json
│       ├── eslint-base.js
│       └── tsconfig.base.json
└── apps/
    └── backend/
        ├── package.json
        ├── tsconfig.json
        ├── .env.example
        ├── src/
        │   ├── main.ts
        │   ├── app.module.ts
        │   ├── common/
        │   │   ├── guards/
        │   │   │   ├── jwt-auth.guard.ts
        │   │   │   └── roles.guard.ts
        │   │   ├── decorators/
        │   │   │   ├── roles.decorator.ts
        │   │   │   └── current-user.decorator.ts
        │   │   ├── filters/
        │   │   │   └── http-exception.filter.ts
        │   │   └── interceptors/
        │   │       └── transform.interceptor.ts
        │   ├── database/
        │   │   ├── database.module.ts
        │   │   └── entities/
        │   │       ├── user.entity.ts
        │   │       ├── user-profile.entity.ts
        │   │       ├── tournament.entity.ts
        │   │       ├── ground.entity.ts
        │   │       ├── tournament-team.entity.ts
        │   │       ├── team.entity.ts
        │   │       ├── team-member.entity.ts
        │   │       ├── match.entity.ts
        │   │       ├── cricket-score.entity.ts
        │   │       ├── badminton-score.entity.ts
        │   │       ├── pickleball-score.entity.ts
        │   │       ├── player-stat.entity.ts
        │   │       ├── notification.entity.ts
        │   │       └── bracket-match.entity.ts
        │   ├── modules/
        │   │   ├── auth/
        │   │   │   ├── auth.module.ts
        │   │   │   ├── auth.controller.ts
        │   │   │   ├── auth.service.ts
        │   │   │   ├── jwt.strategy.ts
        │   │   │   └── dto/
        │   │   │       ├── send-otp.dto.ts
        │   │   │       ├── verify-otp.dto.ts
        │   │   │       └── check-username.dto.ts
        │   │   ├── users/
        │   │   │   ├── users.module.ts
        │   │   │   ├── users.controller.ts
        │   │   │   ├── users.service.ts
        │   │   │   └── dto/
        │   │   │       └── update-profile.dto.ts
        │   │   ├── upload/
        │   │   │   ├── upload.module.ts
        │   │   │   ├── upload.controller.ts
        │   │   │   └── upload.service.ts
        │   │   └── gateway/
        │   │       ├── gateway.module.ts
        │   │       └── score.gateway.ts
        └── test/
            ├── auth.e2e-spec.ts
            └── users.e2e-spec.ts
```

---

## Task 1: Monorepo Root Setup

**Files:**
- Create: `g3-sports/package.json`
- Create: `g3-sports/pnpm-workspace.yaml`
- Create: `g3-sports/turbo.json`
- Create: `g3-sports/.gitignore`

- [ ] **Step 1: Create the root directory and initialize**

```bash
mkdir g3-sports && cd g3-sports
git init
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "g3-sports",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
.env
.env.local
*.log
.turbo/
coverage/
```

- [ ] **Step 6: Install root dependencies**

```bash
pnpm install
```

Expected: `node_modules/` created at root, `pnpm-lock.yaml` generated.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: initialize g3-sports monorepo with Turborepo + pnpm"
```

---

## Task 2: Shared Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/user.types.ts`
- Create: `packages/types/src/match.types.ts`
- Create: `packages/types/src/socket.types.ts`

- [ ] **Step 1: Scaffold the package**

```bash
mkdir -p packages/types/src
```

- [ ] **Step 2: Create `packages/types/package.json`**

```json
{
  "name": "@g3/types",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 3: Create `packages/types/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `packages/types/src/user.types.ts`**

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZER = 'organizer',
  ACADEMY_OWNER = 'academy_owner',
  COACH = 'coach',
  PLAYER = 'player',
}

export enum SportType {
  CRICKET = 'cricket',
  BADMINTON = 'badminton',
  PICKLEBALL = 'pickleball',
}

export interface JwtPayload {
  sub: string;       // user uuid
  role: UserRole;
  phone: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 5: Create `packages/types/src/match.types.ts`**

```typescript
export enum MatchStatus {
  SCHEDULED = 'scheduled',
  TOSS = 'toss',
  LIVE = 'live',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum TournamentFormat {
  KNOCKOUT = 'knockout',
  LEAGUE = 'league',
  GROUP_KNOCKOUT = 'group_knockout',
  ROUND_ROBIN = 'round_robin',
}

export enum TournamentStatus {
  DRAFT = 'draft',
  REGISTRATION = 'registration',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

- [ ] **Step 6: Create `packages/types/src/socket.types.ts`**

```typescript
export interface JoinMatchPayload {
  match_id: string;
}

export interface ScoreUpdatePayload {
  match_id: string;
  sport: string;
  team_a_score: Record<string, unknown>;
  team_b_score: Record<string, unknown>;
  status: string;
  updated_at: string;
}

export interface MatchStatusPayload {
  match_id: string;
  status: string;
}

export interface BracketUpdatePayload {
  tournament_id: string;
  match_id: string;
  winner_id: string;
  next_match_id: string | null;
}

export interface WicketPayload {
  match_id: string;
  player_id: string;
  player_name: string;
  wicket_type: string;
  over: number;
  ball: number;
}
```

- [ ] **Step 7: Create `packages/types/src/index.ts`**

```typescript
export * from './user.types';
export * from './match.types';
export * from './socket.types';
```

- [ ] **Step 8: Build the package**

```bash
cd packages/types && pnpm build
```

Expected: `packages/types/dist/` created with `.js` and `.d.ts` files.

- [ ] **Step 9: Commit**

```bash
cd ../..
git add packages/types/
git commit -m "feat: add @g3/types shared TypeScript types package"
```

---

## Task 3: NestJS Backend Scaffold

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/tsconfig.build.json`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create backend package.json**

```bash
mkdir -p apps/backend/src
```

Create `apps/backend/package.json`:

```json
{
  "name": "@g3/backend",
  "version": "0.0.1",
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@g3/types": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "ioredis": "^5.3.0",
    "firebase-admin": "^12.0.0",
    "cloudinary": "^2.0.0",
    "multer": "^1.4.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "helmet": "^7.0.0",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/multer": "^1.4.11",
    "@types/passport-jwt": "^4.0.0",
    "@types/pg": "^8.0.0",
    "@types/uuid": "^9.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `apps/backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 3: Create `apps/backend/.env.example`**

```env
# App
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=g3sports
DB_PASS=g3sports_password
DB_NAME=g3sports

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Copy it: `cp .env.example .env` and fill real values before running.

- [ ] **Step 4: Create `apps/backend/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`G3 Sports API running on port ${port}`);
}
bootstrap();
```

- [ ] **Step 5: Create `apps/backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { GatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UploadModule,
    GatewayModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Install backend dependencies**

```bash
cd apps/backend && pnpm install
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/backend/
git commit -m "chore: scaffold NestJS backend app with dependencies"
```

---

## Task 4: Database Module + All Entities

**Files:**
- Create: `apps/backend/src/database/database.module.ts`
- Create: `apps/backend/src/database/entities/user.entity.ts`
- Create: `apps/backend/src/database/entities/user-profile.entity.ts`
- Create: `apps/backend/src/database/entities/team.entity.ts`
- Create: `apps/backend/src/database/entities/team-member.entity.ts`
- Create: `apps/backend/src/database/entities/tournament.entity.ts`
- Create: `apps/backend/src/database/entities/ground.entity.ts`
- Create: `apps/backend/src/database/entities/tournament-team.entity.ts`
- Create: `apps/backend/src/database/entities/match.entity.ts`
- Create: `apps/backend/src/database/entities/cricket-score.entity.ts`
- Create: `apps/backend/src/database/entities/badminton-score.entity.ts`
- Create: `apps/backend/src/database/entities/pickleball-score.entity.ts`
- Create: `apps/backend/src/database/entities/player-stat.entity.ts`
- Create: `apps/backend/src/database/entities/notification.entity.ts`
- Create: `apps/backend/src/database/entities/bracket-match.entity.ts`

- [ ] **Step 1: Create `apps/backend/src/database/database.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Tournament } from './entities/tournament.entity';
import { Ground } from './entities/ground.entity';
import { TournamentTeam } from './entities/tournament-team.entity';
import { Match } from './entities/match.entity';
import { CricketScore } from './entities/cricket-score.entity';
import { BadmintonScore } from './entities/badminton-score.entity';
import { PickleballScore } from './entities/pickleball-score.entity';
import { PlayerStat } from './entities/player-stat.entity';
import { Notification } from './entities/notification.entity';
import { BracketMatch } from './entities/bracket-match.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        entities: [
          User, UserProfile, Team, TeamMember, Tournament, Ground,
          TournamentTeam, Match, CricketScore, BadmintonScore,
          PickleballScore, PlayerStat, Notification, BracketMatch,
        ],
        synchronize: cfg.get('NODE_ENV') !== 'production',
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

- [ ] **Step 2: Create `apps/backend/src/database/entities/user.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  Index, OneToOne, OneToMany,
} from 'typeorm';
import { UserRole } from '@g3/types';
import { UserProfile } from './user-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  phone: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'firebase_uid', unique: true, nullable: true })
  firebaseUid: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => UserProfile, (p) => p.user, { cascade: true })
  profile: UserProfile;
}
```

- [ ] **Step 3: Create `apps/backend/src/database/entities/user-profile.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'preferred_sport', type: 'enum', enum: SportType, nullable: true })
  preferredSport: SportType;

  @Column({ name: 'jersey_number', nullable: true })
  jerseyNumber: number;

  @Column({ name: 'batting_style', nullable: true })
  battingStyle: string;

  @Column({ name: 'device_tokens', type: 'text', array: true, default: [] })
  deviceTokens: string[];
}
```

- [ ] **Step 4: Create `apps/backend/src/database/entities/team.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  Index, OneToMany,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Index()
  @Column()
  name: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl: string;

  @Column({ name: 'theme_color', nullable: true })
  themeColor: string;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'captain_id' })
  captain: User;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'sponsor_info', type: 'jsonb', nullable: true })
  sponsorInfo: Record<string, unknown>;
}
```

- [ ] **Step 5: Create `apps/backend/src/database/entities/team-member.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from './user.entity';

export enum TeamMemberRole {
  CAPTAIN = 'captain',
  VICE_CAPTAIN = 'vice_captain',
  PLAYER = 'player',
  SUBSTITUTE = 'substitute',
}

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: TeamMemberRole, default: TeamMemberRole.PLAYER })
  role: TeamMemberRole;

  @Column({ name: 'jersey_number', nullable: true })
  jerseyNumber: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
```

- [ ] **Step 6: Create `apps/backend/src/database/entities/tournament.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { SportType, TournamentFormat, TournamentStatus } from '@g3/types';
import { User } from './user.entity';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: TournamentFormat })
  format: TournamentFormat;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.DRAFT })
  status: TournamentStatus;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'rules_config', type: 'jsonb', default: {} })
  rulesConfig: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 7: Create `apps/backend/src/database/entities/ground.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';
import { Tournament } from './tournament.entity';

@Entity('grounds')
export class Ground {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column()
  name: string;

  @Column({ name: 'sport_type', type: 'enum', enum: SportType })
  sportType: SportType;

  @Column({ nullable: true })
  capacity: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
```

- [ ] **Step 8: Create `apps/backend/src/database/entities/tournament-team.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { Team } from './team.entity';

@Entity('tournament_teams')
export class TournamentTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'group_name', nullable: true })
  groupName: string;

  @Column({ nullable: true })
  seed: number;

  @Column({ name: 'is_eliminated', default: false })
  isEliminated: boolean;

  @Column({ name: 'elimination_round', nullable: true })
  eliminationRound: string;
}
```

- [ ] **Step 9: Create `apps/backend/src/database/entities/match.entity.ts`**

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SportType, MatchStatus } from '@g3/types';
import { Tournament } from './tournament.entity';
import { Ground } from './ground.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => Ground)
  @JoinColumn({ name: 'ground_id' })
  ground: Ground;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_a_id' })
  teamA: Team;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_b_id' })
  teamB: Team;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scorer_id' })
  scorer: User;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ nullable: true })
  round: string;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'winner_id' })
  winner: Team;

  @Column({ name: 'scheduled_at', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'socket_room', nullable: true })
  socketRoom: string;
}
```

- [ ] **Step 10: Create score entities**

Create `apps/backend/src/database/entities/cricket-score.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('cricket_scores')
export class CricketScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ default: 1 })
  innings: number;

  @Column({ default: 0 })
  runs: number;

  @Column({ default: 0 })
  wickets: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  overs: number;

  @Column({ type: 'jsonb', default: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0 } })
  extras: Record<string, number>;

  @Column({ name: 'over_history', type: 'jsonb', default: [] })
  overHistory: Record<string, unknown>[];
}
```

Create `apps/backend/src/database/entities/badminton-score.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity('badminton_scores')
export class BadmintonScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'set_number' })
  setNumber: number;

  @Column({ name: 'team_a_points', default: 0 })
  teamAPoints: number;

  @Column({ name: 'team_b_points', default: 0 })
  teamBPoints: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'set_winner_id' })
  setWinner: Team;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;
}
```

Create `apps/backend/src/database/entities/pickleball-score.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('pickleball_scores')
export class PickleballScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'game_number' })
  gameNumber: number;

  @Column({ name: 'team_a_points', default: 0 })
  teamAPoints: number;

  @Column({ name: 'team_b_points', default: 0 })
  teamBPoints: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'serving_team_id' })
  servingTeam: Team;

  @Column({ name: 'serve_number', default: 1 })
  serveNumber: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'game_winner_id' })
  gameWinner: Team;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;
}
```

- [ ] **Step 11: Create remaining entities**

Create `apps/backend/src/database/entities/player-stat.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('player_stats')
export class PlayerStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'player_id' })
  player: User;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ name: 'stats_data', type: 'jsonb', default: {} })
  statsData: Record<string, unknown>;
}
```

Create `apps/backend/src/database/entities/notification.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  MATCH_START = 'match_start',
  SCORE_UPDATE = 'score_update',
  TOURNAMENT_ALERT = 'tournament_alert',
  ADMIN_ALERT = 'admin_alert',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

Create `apps/backend/src/database/entities/bracket-match.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { Match } from './match.entity';

@Entity('bracket_matches')
export class BracketMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column()
  round: string;

  @Column()
  position: number;

  @ManyToOne(() => BracketMatch, { nullable: true })
  @JoinColumn({ name: 'next_match_id' })
  nextMatch: BracketMatch;
}
```

- [ ] **Step 12: Verify TypeORM synchronize creates tables**

Start PostgreSQL locally (via Docker or native):

```bash
docker run -d --name g3-postgres \
  -e POSTGRES_USER=g3sports \
  -e POSTGRES_PASSWORD=g3sports_password \
  -e POSTGRES_DB=g3sports \
  -p 5432:5432 postgres:15
```

Then run the backend:

```bash
cd apps/backend && pnpm dev
```

Expected: NestJS boots, TypeORM logs show 14 tables created, no errors.

- [ ] **Step 13: Commit**

```bash
cd ../..
git add apps/backend/src/database/
git commit -m "feat: add all 14 TypeORM entities for PostgreSQL schema"
```

---

## Task 5: Common Guards, Decorators, Filters

**Files:**
- Create: `apps/backend/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/backend/src/common/guards/roles.guard.ts`
- Create: `apps/backend/src/common/decorators/roles.decorator.ts`
- Create: `apps/backend/src/common/decorators/current-user.decorator.ts`
- Create: `apps/backend/src/common/filters/http-exception.filter.ts`
- Create: `apps/backend/src/common/interceptors/transform.interceptor.ts`

- [ ] **Step 1: Create `apps/backend/src/common/decorators/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@g3/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 2: Create `apps/backend/src/common/decorators/current-user.decorator.ts`**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 3: Create `apps/backend/src/common/guards/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 4: Create `apps/backend/src/common/guards/roles.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@g3/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

- [ ] **Step 5: Create `apps/backend/src/common/filters/http-exception.filter.ts`**

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 6: Create `apps/backend/src/common/interceptors/transform.interceptor.ts`**

```typescript
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<{ data: T }> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
```

- [ ] **Step 7: Register filter and interceptor globally in `main.ts`**

Replace the existing `main.ts` content:

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalGuards(new RolesGuard(reflector));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`G3 Sports API running on port ${port}`);
}
bootstrap();
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/common/ apps/backend/src/main.ts
git commit -m "feat: add RBAC guards, decorators, exception filter, transform interceptor"
```

---

## Task 6: Firebase + JWT Auth Module

**Files:**
- Create: `apps/backend/src/modules/auth/auth.module.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Create: `apps/backend/src/modules/auth/auth.controller.ts`
- Create: `apps/backend/src/modules/auth/jwt.strategy.ts`
- Create: `apps/backend/src/modules/auth/dto/send-otp.dto.ts`
- Create: `apps/backend/src/modules/auth/dto/verify-otp.dto.ts`
- Create: `apps/backend/src/modules/auth/dto/check-username.dto.ts`
- Test: `apps/backend/test/auth.e2e-spec.ts`

- [ ] **Step 1: Write failing e2e test first (TDD)**

Create `apps/backend/test/auth.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /api/auth/send-otp — rejects missing phone', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/send-otp')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/check-username — returns available for new username', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/check-username')
      .send({ username: 'newuser_xyz_123' });
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd apps/backend && pnpm test:e2e
```

Expected: FAIL — `auth.module` not found yet.

- [ ] **Step 3: Create DTOs**

Create `apps/backend/src/modules/auth/dto/send-otp.dto.ts`:

```typescript
import { IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber()
  phone: string;
}
```

Create `apps/backend/src/modules/auth/dto/verify-otp.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { UserRole } from '@g3/types';
import { IsEnum, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsNotEmpty()
  idToken: string;  // Firebase ID token after OTP verification on client

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
```

Create `apps/backend/src/modules/auth/dto/check-username.dto.ts`:

```typescript
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CheckUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/, { message: 'Only lowercase letters, numbers, underscores' })
  username: string;
}
```

- [ ] **Step 4: Create JWT strategy**

Create `apps/backend/src/modules/auth/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '@g3/types';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    @InjectRepository(User) private users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findOne({ where: { id: payload.sub, isActive: true } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

- [ ] **Step 5: Create auth service**

Create `apps/backend/src/modules/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { UserRole, AuthTokens } from '@g3/types';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private cfg: ConfigService,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(UserProfile) private profiles: Repository<UserProfile>,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: cfg.get('FIREBASE_PROJECT_ID'),
          privateKey: cfg.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: cfg.get('FIREBASE_CLIENT_EMAIL'),
        }),
      });
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens & { user: User }> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(dto.idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }

    if (decoded.phone_number !== dto.phone) {
      throw new UnauthorizedException('Phone mismatch');
    }

    let user = await this.users.findOne({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      user = this.users.create({
        phone: dto.phone,
        firebaseUid: decoded.uid,
        role: dto.role ?? UserRole.PLAYER,
      });
      await this.users.save(user);
      const profile = this.profiles.create({ user });
      await this.profiles.save(profile);
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async checkUsername(username: string): Promise<{ available: boolean }> {
    const existing = await this.users.findOne({ where: { username } });
    return { available: !existing };
  }

  async suggestUsernames(base: string): Promise<{ suggestions: string[] }> {
    const suggestions: string[] = [];
    const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidates = [`${clean}_g3`, `${clean}${Math.floor(Math.random() * 99)}`];
    for (const c of candidates) {
      const { available } = await this.checkUsername(c);
      if (available) suggestions.push(c);
    }
    return { suggestions };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.users.findOneOrFail({ where: { id: payload.sub } });
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, role: user.role, phone: user.phone };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.cfg.get('JWT_SECRET'),
        expiresIn: this.cfg.get('JWT_EXPIRES_IN'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 6: Create auth controller**

Create `apps/backend/src/modules/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('send-otp')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  sendOtp(@Body() body: { phone: string }) {
    // OTP is sent by the Flutter client directly via Firebase SDK.
    // This endpoint validates the phone format and returns a success signal.
    if (!body.phone) return { message: 'phone required' };
    return { message: 'Proceed with Firebase OTP on client' };
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('check-username')
  checkUsername(@Body() dto: CheckUsernameDto) {
    return this.auth.checkUsername(dto.username);
  }

  @Post('suggest-usernames')
  suggestUsernames(@Body() body: { base: string }) {
    return this.auth.suggestUsernames(body.base ?? 'player');
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  refreshToken(@Body() body: { refreshToken: string }) {
    return this.auth.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: { user: { id: string } }) {
    // Stateless JWT — client discards tokens. Future: add refresh token blocklist.
    return { message: 'Logged out', userId: req.user.id };
  }
}
```

- [ ] **Step 7: Create auth module**

Create `apps/backend/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, UserProfile]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 8: Run the e2e tests**

```bash
cd apps/backend && pnpm test:e2e
```

Expected: Both tests PASS.

- [ ] **Step 9: Commit**

```bash
cd ../..
git add apps/backend/src/modules/auth/ apps/backend/test/auth.e2e-spec.ts
git commit -m "feat: add Firebase OTP → JWT auth module with RBAC"
```

---

## Task 7: Users Module (Profile CRUD)

**Files:**
- Create: `apps/backend/src/modules/users/users.module.ts`
- Create: `apps/backend/src/modules/users/users.service.ts`
- Create: `apps/backend/src/modules/users/users.controller.ts`
- Create: `apps/backend/src/modules/users/dto/update-profile.dto.ts`

- [ ] **Step 1: Create DTO**

Create `apps/backend/src/modules/users/dto/update-profile.dto.ts`:

```typescript
import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUrl } from 'class-validator';
import { SportType, UserRole } from '@g3/types';

export class UpdateProfileDto {
  @IsString() @IsOptional() fullName?: string;
  @IsUrl() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() city?: string;
  @IsEnum(SportType) @IsOptional() preferredSport?: SportType;
  @IsInt() @Min(1) @Max(999) @IsOptional() jerseyNumber?: number;
  @IsString() @IsOptional() battingStyle?: string;
  @IsString() @IsOptional() username?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
}
```

- [ ] **Step 2: Create users service**

Create `apps/backend/src/modules/users/users.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(UserProfile) private profiles: Repository<UserProfile>,
  ) {}

  async findById(id: string) {
    const user = await this.users.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);

    if (dto.username && dto.username !== user.username) {
      const taken = await this.users.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username already taken');
      user.username = dto.username;
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.role !== undefined) user.role = dto.role;

    await this.users.save(user);

    if (!user.profile) {
      user.profile = this.profiles.create({ user });
    }
    if (dto.bio !== undefined) user.profile.bio = dto.bio;
    if (dto.city !== undefined) user.profile.city = dto.city;
    if (dto.preferredSport !== undefined) user.profile.preferredSport = dto.preferredSport;
    if (dto.jerseyNumber !== undefined) user.profile.jerseyNumber = dto.jerseyNumber;
    if (dto.battingStyle !== undefined) user.profile.battingStyle = dto.battingStyle;
    await this.profiles.save(user.profile);

    return this.findById(userId);
  }

  async addDeviceToken(userId: string, token: string) {
    const profile = await this.profiles.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (!profile.deviceTokens.includes(token)) {
      profile.deviceTokens = [...profile.deviceTokens, token];
      await this.profiles.save(profile);
    }
    return { message: 'Device token registered' };
  }
}
```

- [ ] **Step 3: Create users controller**

Create `apps/backend/src/modules/users/users.controller.ts`:

```typescript
import { Controller, Get, Put, Body, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.users.findById(user.id);
  }

  @Put('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Post('me/device-token')
  addDeviceToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.users.addDeviceToken(user.id, body.token);
  }
}
```

- [ ] **Step 4: Create users module**

Create `apps/backend/src/modules/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Verify backend starts clean**

```bash
cd apps/backend && pnpm dev
```

Expected: No TypeScript errors. `GET /api/users/me` returns 401 when called without JWT (correct behavior).

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/backend/src/modules/users/
git commit -m "feat: add users module with profile CRUD and device token registration"
```

---

## Task 8: Redis + Socket.IO Gateway

**Files:**
- Create: `apps/backend/src/modules/gateway/gateway.module.ts`
- Create: `apps/backend/src/modules/gateway/score.gateway.ts`

- [ ] **Step 1: Start Redis locally**

```bash
docker run -d --name g3-redis -p 6379:6379 redis:7
```

Verify: `docker exec g3-redis redis-cli ping` → `PONG`

- [ ] **Step 2: Create score gateway**

Create `apps/backend/src/modules/gateway/score.gateway.ts`:

```typescript
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JoinMatchPayload, ScoreUpdatePayload } from '@g3/types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ScoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private redis: Redis;

  constructor(cfg: ConfigService) {
    this.redis = new Redis({
      host: cfg.get('REDIS_HOST', 'localhost'),
      port: cfg.get<number>('REDIS_PORT', 6379),
    });
  }

  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @MessageBody() payload: JoinMatchPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `match:${payload.match_id}`;
    await client.join(room);

    // Send cached state immediately on join
    const cached = await this.redis.get(`score:${payload.match_id}`);
    if (cached) {
      client.emit('score_update', JSON.parse(cached));
    }

    return { joined: room };
  }

  async broadcastScoreUpdate(matchId: string, payload: ScoreUpdatePayload) {
    const room = `match:${matchId}`;
    // Cache in Redis for instant delivery to late joiners
    await this.redis.setex(`score:${matchId}`, 3600, JSON.stringify(payload));
    this.server.to(room).emit('score_update', payload);
  }

  async broadcastMatchStatus(matchId: string, status: string) {
    this.server.to(`match:${matchId}`).emit('match_status', { match_id: matchId, status });
  }

  async broadcastBracketUpdate(payload: Record<string, unknown>) {
    const tournamentRoom = `tournament:${payload['tournament_id']}`;
    this.server.to(tournamentRoom).emit('bracket_update', payload);
  }
}
```

- [ ] **Step 3: Create gateway module**

Create `apps/backend/src/modules/gateway/gateway.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ScoreGateway } from './score.gateway';

@Module({
  providers: [ScoreGateway],
  exports: [ScoreGateway],
})
export class GatewayModule {}
```

- [ ] **Step 4: Restart backend and verify WebSocket**

```bash
cd apps/backend && pnpm dev
```

Use a Socket.IO test client or `wscat`:

```bash
npx wscat -c ws://localhost:3001
> 42["join_match",{"match_id":"test-123"}]
```

Expected: Response `42["joined","match:test-123"]` (or no error). Redis `GET score:test-123` returns null (expected for nonexistent match).

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/backend/src/modules/gateway/
git commit -m "feat: add Socket.IO score gateway with Redis live score caching"
```

---

## Task 9: Cloudinary Upload Module

**Files:**
- Create: `apps/backend/src/modules/upload/upload.module.ts`
- Create: `apps/backend/src/modules/upload/upload.service.ts`
- Create: `apps/backend/src/modules/upload/upload.controller.ts`

- [ ] **Step 1: Create upload service**

Create `apps/backend/src/modules/upload/upload.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export type UploadFolder = 'avatars' | 'team-logos' | 'team-banners' | 'tournament-banners';

@Injectable()
export class UploadService {
  constructor(cfg: ConfigService) {
    cloudinary.config({
      cloud_name: cfg.get('CLOUDINARY_CLOUD_NAME'),
      api_key: cfg.get('CLOUDINARY_API_KEY'),
      api_secret: cfg.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: UploadFolder,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `g3sports/${folder}`, public_id: publicId, overwrite: true },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      stream.end(buffer);
    });
  }

  async deleteAsset(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
```

- [ ] **Step 2: Create upload controller**

Create `apps/backend/src/modules/upload/upload.controller.ts`:

```typescript
import {
  Controller, Post, UploadedFile, UseInterceptors,
  UseGuards, Query, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadFolder } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const ALLOWED_FOLDERS: UploadFolder[] = ['avatars', 'team-logos', 'team-banners', 'tournament-banners'];

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private upload: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: UploadFolder,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new BadRequestException(`folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`);
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP allowed');
    }
    const result = await this.upload.uploadBuffer(file.buffer, folder);
    return { url: result.secure_url, publicId: result.public_id };
  }
}
```

- [ ] **Step 3: Create upload module**

Create `apps/backend/src/modules/upload/upload.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/upload/
git commit -m "feat: add Cloudinary upload module for avatars, team logos, banners"
```

---

## Task 10: Backend Smoke Test + Send-OTP Validation Fix

- [ ] **Step 1: Run all e2e tests**

```bash
cd apps/backend && pnpm test:e2e
```

Expected: All tests PASS.

- [ ] **Step 2: Fix send-otp DTO validation**

The `send-otp` controller currently accepts any body. Add proper DTO validation:

Replace `apps/backend/src/modules/auth/auth.controller.ts` `sendOtp` handler:

```typescript
import { SendOtpDto } from './dto/send-otp.dto';

// In the class:
@Post('send-otp')
@Throttle({ default: { ttl: 60000, limit: 5 } })
sendOtp(@Body() dto: SendOtpDto) {
  return { message: 'Proceed with Firebase OTP on client', phone: dto.phone };
}
```

- [ ] **Step 3: Re-run e2e tests**

```bash
pnpm test:e2e
```

Expected: `send-otp rejects missing phone` test still passes (400 from DTO validation).

- [ ] **Step 4: Final commit for Phase 1 backend**

```bash
cd ../..
git add apps/backend/
git commit -m "feat: complete Phase 1 backend — auth, users, Socket.IO gateway, Cloudinary upload"
```

---

## Summary

Phase 1 backend produces a running NestJS API with:
- 14 PostgreSQL tables via TypeORM (auto-synced in dev)
- Firebase OTP → JWT auth with refresh tokens
- RBAC guards on all protected routes
- Username availability check + suggestions
- User/profile CRUD
- Socket.IO real-time gateway with Redis live score cache
- Cloudinary media upload (avatars, logos, banners)
- Global validation, error filter, response transform
- Rate limiting on auth endpoints

Next plan: `2026-05-18-phase1-marketing-web.md` — Next.js 14 marketing site with all 3 pages.
