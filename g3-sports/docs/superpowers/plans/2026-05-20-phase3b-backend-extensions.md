# Phase 3B — Backend Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the NestJS backend with registration deadlines, per-match scoring config, match start/complete endpoints, bracket auto-advancement, and organizer role-request flow.

**Architecture:** Add new columns to Tournament and Match entities (TypeORM synchronize will handle DB migrations in dev; a manual migration is needed in prod). Add a new `RoleRequest` entity. Extend existing services rather than creating new modules where possible.

**Tech Stack:** NestJS 10, TypeORM, PostgreSQL (Neon), existing `@g3/types` package.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/types/src/user.types.ts` | Modify | Add `SCORER` role (tournament-scoped, stored on match not user) — actually keep as-is; scorer is match.scorer relation |
| `apps/backend/src/database/entities/tournament.entity.ts` | Modify | Add `registrationDeadline`, `location` columns |
| `apps/backend/src/database/entities/match.entity.ts` | Modify | Add `scoringConfig` JSONB column |
| `apps/backend/src/database/entities/role-request.entity.ts` | Create | RoleRequest table |
| `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts` | Modify | Add `registrationDeadline`, `location` fields |
| `apps/backend/src/modules/tournaments/tournaments.service.ts` | Modify | Save registrationDeadline + location; validate deadline before bracket |
| `apps/backend/src/modules/bracket/bracket.service.ts` | Modify | Check registrationDeadline before generating |
| `apps/backend/src/modules/matches/dto/start-match.dto.ts` | Create | DTO for start-match endpoint |
| `apps/backend/src/modules/matches/matches.service.ts` | Modify | Add `startMatch`, `completeMatch` methods |
| `apps/backend/src/modules/matches/matches.controller.ts` | Modify | Add `PATCH /:id/start`, `PATCH /:id/complete` endpoints |
| `apps/backend/src/modules/score/score.service.ts` | Modify | Read `match.scoringConfig` in `recordBadmintonPoint` |
| `apps/backend/src/modules/users/users.service.ts` | Modify | Add role-request CRUD |
| `apps/backend/src/modules/users/users.controller.ts` | Modify | Add `POST /role-requests`, `GET /role-requests` (admin), `PATCH /role-requests/:id` |
| `apps/backend/src/modules/users/users.module.ts` | Modify | Register RoleRequest repository |

---

### Task 1: Add `registrationDeadline` and `location` to Tournament

**Files:**
- Modify: `apps/backend/src/database/entities/tournament.entity.ts`
- Modify: `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`
- Modify: `apps/backend/src/modules/tournaments/tournaments.service.ts`

- [ ] **Step 1: Add columns to Tournament entity**

Open `apps/backend/src/database/entities/tournament.entity.ts` and add after the `endDate` column:

```typescript
@Column({ name: 'registration_deadline', type: 'date', nullable: true })
registrationDeadline: Date | null;

@Column({ type: 'varchar', nullable: true })
location: string | null;
```

Full updated file:
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

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: TournamentFormat })
  format: TournamentFormat;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.DRAFT })
  status: TournamentStatus;

  @Column({ name: 'banner_url', type: 'varchar', nullable: true })
  bannerUrl: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'registration_deadline', type: 'date', nullable: true })
  registrationDeadline: Date | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ name: 'rules_config', type: 'jsonb', default: {} })
  rulesConfig: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 2: Update CreateTournamentDto**

Full updated `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`:
```typescript
import { IsString, IsEnum, IsDateString, IsOptional, IsObject } from 'class-validator';
import { SportType, TournamentFormat } from '@g3/types';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsEnum(TournamentFormat) format: TournamentFormat;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsDateString() registrationDeadline?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsObject() rulesConfig?: Record<string, unknown>;
}
```

- [ ] **Step 3: Update tournaments.service.ts `create` method**

In `apps/backend/src/modules/tournaments/tournaments.service.ts`, update the `create` method:

```typescript
create(dto: CreateTournamentDto, organizerId: string): Promise<Tournament> {
  const tournament = this.tournamentRepo.create({
    ...dto,
    startDate: new Date(dto.startDate),
    endDate: new Date(dto.endDate),
    registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null,
    location: dto.location ?? null,
    organizer: { id: organizerId },
    status: TournamentStatus.DRAFT,
  });
  return this.tournamentRepo.save(tournament);
}
```

- [ ] **Step 4: Build and verify no TypeScript errors**

```bash
cd g3-sports
pnpm --filter @g3/backend build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/database/entities/tournament.entity.ts
git add apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts
git add apps/backend/src/modules/tournaments/tournaments.service.ts
git commit -m "feat: add registrationDeadline and location to Tournament"
```

---

### Task 2: Add `scoringConfig` to Match entity

**Files:**
- Modify: `apps/backend/src/database/entities/match.entity.ts`

- [ ] **Step 1: Add scoringConfig JSONB column to Match entity**

In `apps/backend/src/database/entities/match.entity.ts`, add after the `socketRoom` column:

```typescript
@Column({ name: 'scoring_config', type: 'jsonb', nullable: true })
scoringConfig: { pointsPerSet: number; deuceRule: 'GOLDEN_POINT' | 'STANDARD' } | null;
```

Full updated file:
```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
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

  @ManyToOne(() => Ground, { nullable: true })
  @JoinColumn({ name: 'ground_id' })
  ground: Ground | null;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_a_id' })
  teamA: Team;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_b_id' })
  teamB: Team;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scorer_id' })
  scorer: User | null;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ type: 'varchar', nullable: true })
  round: string | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'winner_id' })
  winner: Team | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'socket_room', type: 'varchar', nullable: true })
  socketRoom: string | null;

  @Column({ name: 'scoring_config', type: 'jsonb', nullable: true })
  scoringConfig: { pointsPerSet: number; deuceRule: 'GOLDEN_POINT' | 'STANDARD' } | null;
}
```

- [ ] **Step 2: Build and verify**

```bash
pnpm --filter @g3/backend build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/database/entities/match.entity.ts
git commit -m "feat: add scoringConfig JSONB column to Match entity"
```

---

### Task 3: Add match start/complete endpoints

**Files:**
- Create: `apps/backend/src/modules/matches/dto/start-match.dto.ts`
- Modify: `apps/backend/src/modules/matches/matches.service.ts`
- Modify: `apps/backend/src/modules/matches/matches.controller.ts`

- [ ] **Step 1: Create StartMatchDto**

Create `apps/backend/src/modules/matches/dto/start-match.dto.ts`:
```typescript
import { IsInt, IsIn, IsEnum } from 'class-validator';

export class StartMatchDto {
  @IsInt()
  @IsIn([11, 21])
  pointsPerSet: number;

  @IsIn(['GOLDEN_POINT', 'STANDARD'])
  deuceRule: 'GOLDEN_POINT' | 'STANDARD';
}
```

- [ ] **Step 2: Add `startMatch` and `completeMatch` to matches.service.ts**

Add these two methods to `MatchesService` in `apps/backend/src/modules/matches/matches.service.ts`.

First add the `BracketMatch` import at the top (after existing imports):
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// add:
import { BracketMatch } from '../../database/entities/bracket-match.entity';
```

Also add `BracketMatch` to constructor:
```typescript
constructor(
  @InjectRepository(Match) private matchRepo: Repository<Match>,
  @InjectRepository(Ground) private groundRepo: Repository<Ground>,
  @InjectRepository(BracketMatch) private bracketMatchRepo: Repository<BracketMatch>,
) {}
```

Add these methods to the class:
```typescript
async startMatch(matchId: string, scorerId: string, dto: StartMatchDto): Promise<Match> {
  const m = await this.findOne(matchId);
  if (m.status !== MatchStatus.SCHEDULED) {
    throw new BadRequestException('Match must be SCHEDULED to start');
  }
  if (!m.scorer || m.scorer.id !== scorerId) {
    throw new ForbiddenException('Only the assigned scorer can start this match');
  }
  m.status = MatchStatus.LIVE;
  m.startedAt = new Date();
  m.scoringConfig = { pointsPerSet: dto.pointsPerSet, deuceRule: dto.deuceRule };
  return this.matchRepo.save(m);
}

async completeMatch(matchId: string, scorerId: string, winnerTeamId: string): Promise<Match> {
  const m = await this.findOne(matchId);
  if (m.status !== MatchStatus.LIVE) {
    throw new BadRequestException('Match must be LIVE to complete');
  }
  if (!m.scorer || m.scorer.id !== scorerId) {
    throw new ForbiddenException('Only the assigned scorer can complete this match');
  }
  if (m.teamA.id !== winnerTeamId && m.teamB.id !== winnerTeamId) {
    throw new BadRequestException('winnerTeamId must be one of the match teams');
  }
  m.status = MatchStatus.COMPLETED;
  m.completedAt = new Date();
  m.winner = { id: winnerTeamId } as any;
  await this.matchRepo.save(m);

  // Auto-advance bracket
  const bm = await this.bracketMatchRepo.findOne({
    where: { match: { id: matchId } },
    relations: ['match', 'nextMatch', 'nextMatch.match', 'tournament'],
  });
  if (bm && bm.nextMatch) {
    const next = bm.nextMatch;
    const isTeamA = bm.position % 2 === 0;
    const nextRound = String(Number(bm.round) + 1);
    if (!next.match) {
      const nextMatch = this.matchRepo.create({
        tournament: { id: bm.tournament.id } as any,
        sport: m.sport,
        status: MatchStatus.SCHEDULED,
        round: nextRound,
        socketRoom: `match:${bm.tournament.id}:r${nextRound}:p${next.position}`,
        ...(isTeamA
          ? { teamA: { id: winnerTeamId } as any }
          : { teamB: { id: winnerTeamId } as any }),
      });
      const savedNext = await this.matchRepo.save(nextMatch);
      next.match = savedNext;
    } else {
      if (isTeamA) next.match.teamA = { id: winnerTeamId } as any;
      else next.match.teamB = { id: winnerTeamId } as any;
      await this.matchRepo.save(next.match);
    }
    await this.bracketMatchRepo.save(next);
  }

  return this.findOne(matchId);
}
```

- [ ] **Step 3: Register BracketMatch in MatchesModule**

Open `apps/backend/src/modules/matches/matches.module.ts` and add `BracketMatch` to the TypeOrmModule imports:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Match } from '../../database/entities/match.entity';
import { Ground } from '../../database/entities/ground.entity';
import { BracketMatch } from '../../database/entities/bracket-match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Ground, BracketMatch])],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
```

- [ ] **Step 4: Add endpoints to matches.controller.ts**

Add these imports at top:
```typescript
import { StartMatchDto } from './dto/start-match.dto';
import { ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
```

Add these endpoints to `MatchesController`:
```typescript
@Patch(':id/start')
@UseGuards(JwtAuthGuard)
startMatch(
  @Param('id') id: string,
  @Body() dto: StartMatchDto,
  @CurrentUser() user: User,
) {
  return this.svc.startMatch(id, user.id, dto);
}

@Patch(':id/complete')
@UseGuards(JwtAuthGuard)
completeMatch(
  @Param('id') id: string,
  @Body('winnerTeamId') winnerTeamId: string,
  @CurrentUser() user: User,
) {
  return this.svc.completeMatch(id, user.id, winnerTeamId);
}
```

- [ ] **Step 5: Build and verify**

```bash
pnpm --filter @g3/backend build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/matches/dto/start-match.dto.ts
git add apps/backend/src/modules/matches/matches.service.ts
git add apps/backend/src/modules/matches/matches.controller.ts
git add apps/backend/src/modules/matches/matches.module.ts
git commit -m "feat: add PATCH /matches/:id/start and /complete endpoints with bracket auto-advancement"
```

---

### Task 4: Update badminton scoring to use scoringConfig

**Files:**
- Modify: `apps/backend/src/modules/score/score.service.ts`

- [ ] **Step 1: Update `recordBadmintonPoint` to read match scoringConfig**

In `apps/backend/src/modules/score/score.service.ts`, replace the `recordBadmintonPoint` method:

```typescript
async recordBadmintonPoint(dto: BadmintonPointDto): Promise<BadmintonScore> {
  const match = await this.matchRepo.findOne({
    where: { id: dto.matchId },
    relations: ['teamA', 'teamB'],
  });
  if (!match) throw new NotFoundException('Match not found');
  if (match.status !== MatchStatus.LIVE) throw new BadRequestException('Match is not live');

  // Read scoring config — default to BWF standard if not set
  const pointsPerSet = match.scoringConfig?.pointsPerSet ?? 21;
  const deuceRule = match.scoringConfig?.deuceRule ?? 'STANDARD';

  const set = await this.getOrCreateBadmintonSet(dto.matchId, dto.setNumber);
  if (set.isCompleted) throw new BadRequestException('Set already completed');

  if (dto.scoringTeam === 'A') set.teamAPoints += 1;
  else set.teamBPoints += 1;

  const a = set.teamAPoints;
  const b = set.teamBPoints;
  const maxPoints = pointsPerSet;

  let winner: typeof match.teamA | null = null;

  if (deuceRule === 'GOLDEN_POINT') {
    // At maxPoints-1 each: next point wins (golden point)
    if (a >= maxPoints && b < maxPoints) winner = match.teamA;
    else if (b >= maxPoints && a < maxPoints) winner = match.teamB;
    else if (a === maxPoints && b === maxPoints) {
      // tied at max — next point (already incremented above) wins
      // we check who has more after the increment
      if (a > b) winner = match.teamA;
      else if (b > a) winner = match.teamB;
    } else if (a > maxPoints) winner = match.teamA;
    else if (b > maxPoints) winner = match.teamB;
  } else {
    // STANDARD deuce: need 2-point lead, cap at maxPoints + 9 (e.g. 30 for 21-pt)
    const cap = maxPoints + 9;
    if ((a >= maxPoints && a - b >= 2) || a >= cap) winner = match.teamA;
    else if ((b >= maxPoints && b - a >= 2) || b >= cap) winner = match.teamB;
  }

  if (winner) {
    set.isCompleted = true;
    set.setWinner = winner;
  }

  const saved = await this.badmintonRepo.save(set);

  const allSets = await this.badmintonRepo.find({
    where: { match: { id: dto.matchId } },
    order: { setNumber: 'ASC' },
  });
  await this.gateway.broadcastScoreUpdate(dto.matchId, {
    match_id: dto.matchId,
    sport: SportType.BADMINTON,
    team_a_score: { sets: allSets.map(s => s.teamAPoints) } as Record<string, unknown>,
    team_b_score: { sets: allSets.map(s => s.teamBPoints) } as Record<string, unknown>,
    status: match.status,
    updated_at: new Date().toISOString(),
  });

  return saved;
}
```

- [ ] **Step 2: Build and verify**

```bash
pnpm --filter @g3/backend build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/score/score.service.ts
git commit -m "feat: badminton scoring reads scoringConfig — supports 11/21 pts and golden point / standard deuce"
```

---

### Task 5: Registration deadline check in bracket generation

**Files:**
- Modify: `apps/backend/src/modules/bracket/bracket.service.ts`

- [ ] **Step 1: Add Tournament import and deadline check to `generate`**

In `bracket.service.ts`, add `Tournament` to imports:
```typescript
import { Tournament } from '../../database/entities/tournament.entity';
```

Add `Tournament` repository to constructor:
```typescript
constructor(
  @InjectRepository(BracketMatch) private bmRepo: Repository<BracketMatch>,
  @InjectRepository(Match) private matchRepo: Repository<Match>,
  @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
  @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
) {}
```

At the top of `generate()` method, add deadline check after the `existing` check:
```typescript
async generate(tournamentId: string, sport: SportType): Promise<BracketMatch[]> {
  const existing = await this.bmRepo.findOne({ where: { tournament: { id: tournamentId } } });
  if (existing) throw new BadRequestException('Bracket already generated for this tournament');

  // Check registration deadline
  const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
  if (!tournament) throw new NotFoundException('Tournament not found');
  if (tournament.registrationDeadline && new Date() < new Date(tournament.registrationDeadline)) {
    throw new BadRequestException('Registration deadline has not passed yet. Cannot generate fixtures before deadline.');
  }

  // ... rest of existing generate method unchanged
```

- [ ] **Step 2: Register Tournament in BracketModule**

Open `apps/backend/src/modules/bracket/bracket.module.ts` and add `Tournament`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BracketController } from './bracket.controller';
import { BracketService } from './bracket.service';
import { BracketMatch } from '../../database/entities/bracket-match.entity';
import { Match } from '../../database/entities/match.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { Tournament } from '../../database/entities/tournament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BracketMatch, Match, TournamentTeam, Tournament])],
  controllers: [BracketController],
  providers: [BracketService],
})
export class BracketModule {}
```

- [ ] **Step 3: Build and verify**

```bash
pnpm --filter @g3/backend build
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/bracket/bracket.service.ts
git add apps/backend/src/modules/bracket/bracket.module.ts
git commit -m "feat: block bracket generation before registrationDeadline"
```

---

### Task 6: Role-request entity and endpoints

**Files:**
- Create: `apps/backend/src/database/entities/role-request.entity.ts`
- Modify: `apps/backend/src/modules/users/users.service.ts`
- Modify: `apps/backend/src/modules/users/users.controller.ts`
- Modify: `apps/backend/src/modules/users/users.module.ts`

- [ ] **Step 1: Create RoleRequest entity**

Create `apps/backend/src/database/entities/role-request.entity.ts`:
```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum RoleRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}

@Entity('role_requests')
export class RoleRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({
    type: 'enum',
    enum: RoleRequestStatus,
    default: RoleRequestStatus.PENDING,
  })
  status: RoleRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;
}
```

- [ ] **Step 2: Add role-request methods to UsersService**

Add these imports at top of `users.service.ts`:
```typescript
import { RoleRequest, RoleRequestStatus } from '../../database/entities/role-request.entity';
import { UserRole } from '@g3/types';
import { ForbiddenException } from '@nestjs/common';
```

Add `RoleRequest` repository to constructor:
```typescript
constructor(
  @InjectRepository(User) private readonly users: Repository<User>,
  @InjectRepository(UserProfile) private readonly profiles: Repository<UserProfile>,
  @InjectRepository(RoleRequest) private readonly roleRequests: Repository<RoleRequest>,
) {}
```

Add these methods to `UsersService`:
```typescript
async requestOrganizerRole(userId: string, reason?: string): Promise<RoleRequest> {
  const existing = await this.roleRequests.findOne({
    where: { user: { id: userId }, status: RoleRequestStatus.PENDING },
  });
  if (existing) throw new BadRequestException('You already have a pending role upgrade request');

  const user = await this.findById(userId);
  if (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN) {
    throw new BadRequestException('You already have organizer or higher access');
  }

  const request = this.roleRequests.create({
    user: { id: userId } as User,
    reason: reason ?? null,
    status: RoleRequestStatus.PENDING,
  });
  return this.roleRequests.save(request);
}

async getMyRoleRequest(userId: string): Promise<RoleRequest | null> {
  return this.roleRequests.findOne({
    where: { user: { id: userId } },
    order: { createdAt: 'DESC' },
  });
}

async listRoleRequests(): Promise<RoleRequest[]> {
  return this.roleRequests.find({
    relations: ['user'],
    order: { createdAt: 'DESC' },
  });
}

async reviewRoleRequest(
  requestId: string,
  action: 'approve' | 'deny',
): Promise<RoleRequest> {
  const req = await this.roleRequests.findOne({
    where: { id: requestId },
    relations: ['user'],
  });
  if (!req) throw new NotFoundException('Role request not found');
  if (req.status !== RoleRequestStatus.PENDING) {
    throw new BadRequestException('Request already reviewed');
  }

  req.status = action === 'approve' ? RoleRequestStatus.APPROVED : RoleRequestStatus.DENIED;
  req.reviewedAt = new Date();
  await this.roleRequests.save(req);

  if (action === 'approve') {
    req.user.role = UserRole.ORGANIZER;
    await this.users.save(req.user);
  }

  return req;
}
```

- [ ] **Step 3: Add endpoints to UsersController**

Add these imports at top of `users.controller.ts`:
```typescript
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@g3/types';
```

Add these endpoints inside `UsersController`:
```typescript
// ─── Role Requests ────────────────────────────────────────────────────────────

@Post('role-requests')
requestOrganizerRole(
  @CurrentUser() user: User,
  @Body('reason') reason?: string,
) {
  return this.users.requestOrganizerRole(user.id, reason);
}

@Get('role-requests/mine')
getMyRoleRequest(@CurrentUser() user: User) {
  return this.users.getMyRoleRequest(user.id);
}

@Get('role-requests')
@Roles(UserRole.SUPER_ADMIN)
listRoleRequests() {
  return this.users.listRoleRequests();
}

@Patch('role-requests/:id')
@Roles(UserRole.SUPER_ADMIN)
reviewRoleRequest(
  @Param('id') id: string,
  @Body('action') action: 'approve' | 'deny',
) {
  return this.users.reviewRoleRequest(id, action);
}
```

- [ ] **Step 4: Register RoleRequest in UsersModule**

Update `apps/backend/src/modules/users/users.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { RoleRequest } from '../../database/entities/role-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, RoleRequest])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Build and verify**

```bash
pnpm --filter @g3/backend build
```

Expected: Build succeeds.

- [ ] **Step 6: Push to Render for deployment**

```bash
git add apps/backend/src/database/entities/role-request.entity.ts
git add apps/backend/src/modules/users/users.service.ts
git add apps/backend/src/modules/users/users.controller.ts
git add apps/backend/src/modules/users/users.module.ts
git commit -m "feat: add organizer role-request entity and admin review endpoints"
git push origin main
git push origin main:master
```

Expected: Render auto-deploys. New table `role_requests` created automatically (TypeORM synchronize is enabled in prod temporarily — remove `DB_SYNC=true` from Render env after this deploy).

---

### Task 7: Smoke-test all new endpoints via curl

- [ ] **Step 1: Test tournament creation with deadline**

```bash
curl -X POST https://g3-sports-backend.onrender.com/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name":"Test Cup","sport":"badminton","format":"SINGLE_ELIMINATION","startDate":"2026-06-01","endDate":"2026-06-07","registrationDeadline":"2026-05-30","location":"Chennai"}'
```

Expected: `201` response with `registrationDeadline` and `location` in body.

- [ ] **Step 2: Test start match**

```bash
curl -X PATCH https://g3-sports-backend.onrender.com/api/matches/<matchId>/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <scorer_token>" \
  -d '{"pointsPerSet":21,"deuceRule":"GOLDEN_POINT"}'
```

Expected: `200` with `status: "live"` and `scoringConfig` in body.

- [ ] **Step 3: Test role request submission**

```bash
curl -X POST https://g3-sports-backend.onrender.com/api/users/role-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <player_token>" \
  -d '{"reason":"I want to organise local tournaments"}'
```

Expected: `201` with `status: "pending"`.

- [ ] **Step 4: Test admin list role requests**

```bash
curl https://g3-sports-backend.onrender.com/api/users/role-requests \
  -H "Authorization: Bearer <admin_token>"
```

Expected: `200` array with the request.

- [ ] **Step 5: Commit smoke-test confirmation**

No code changes — just confirm all endpoints work. Move to Plan B.
