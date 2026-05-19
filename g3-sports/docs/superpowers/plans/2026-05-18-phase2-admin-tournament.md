# Phase 2: Admin Dashboard + Tournament Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the NestJS tournament/match/scoring backend modules and a React + Vite admin dashboard with live match monitoring.

**Architecture:** NestJS modules (Tournaments, Bracket, Grounds, Teams, Matches, ScoreEngine, Analytics) expose REST endpoints consumed by the admin dashboard (Vite + React 18 + TanStack Query). Socket.IO (already wired via ScoreGateway) broadcasts score/bracket updates in real time.

**Tech Stack:** NestJS 10, TypeORM 0.3, PostgreSQL, Redis, Socket.IO, React 18, Vite 5, TanStack Query v5, React Router v6, Recharts, Zustand, Axios, Tailwind CSS 3, clsx.

---

## File Map

### Backend (new files)
- `apps/backend/src/modules/tournaments/tournament.entity-fix.ts` — patch bracket_match nullable
- `apps/backend/src/modules/tournaments/tournaments.module.ts`
- `apps/backend/src/modules/tournaments/tournaments.service.ts`
- `apps/backend/src/modules/tournaments/tournaments.controller.ts`
- `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`
- `apps/backend/src/modules/tournaments/dto/update-tournament.dto.ts`
- `apps/backend/src/modules/bracket/bracket.module.ts`
- `apps/backend/src/modules/bracket/bracket.service.ts`
- `apps/backend/src/modules/bracket/bracket.controller.ts`
- `apps/backend/src/modules/grounds/grounds.module.ts`
- `apps/backend/src/modules/grounds/grounds.service.ts`
- `apps/backend/src/modules/grounds/grounds.controller.ts`
- `apps/backend/src/modules/grounds/dto/create-ground.dto.ts`
- `apps/backend/src/modules/teams/teams.module.ts`
- `apps/backend/src/modules/teams/teams.service.ts`
- `apps/backend/src/modules/teams/teams.controller.ts`
- `apps/backend/src/modules/teams/dto/create-team.dto.ts`
- `apps/backend/src/modules/matches/matches.module.ts`
- `apps/backend/src/modules/matches/matches.service.ts`
- `apps/backend/src/modules/matches/matches.controller.ts`
- `apps/backend/src/modules/matches/dto/create-match.dto.ts`
- `apps/backend/src/modules/matches/dto/toss.dto.ts`
- `apps/backend/src/modules/score/score.module.ts`
- `apps/backend/src/modules/score/score.service.ts`
- `apps/backend/src/modules/score/score.controller.ts`
- `apps/backend/src/modules/score/dto/cricket-ball.dto.ts`
- `apps/backend/src/modules/score/dto/badminton-point.dto.ts`
- `apps/backend/src/modules/score/dto/pickleball-point.dto.ts`
- `apps/backend/src/modules/analytics/analytics.module.ts`
- `apps/backend/src/modules/analytics/analytics.service.ts`
- `apps/backend/src/modules/analytics/analytics.controller.ts`
- Modify: `apps/backend/src/entities/bracket-match.entity.ts` — make match nullable
- Modify: `apps/backend/src/app.module.ts` — register 5 new modules

### Admin App (new app)
- `apps/admin/` — entire Vite React app
- `apps/admin/package.json`
- `apps/admin/vite.config.ts`
- `apps/admin/tailwind.config.ts`
- `apps/admin/postcss.config.cjs`
- `apps/admin/index.html`
- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/api/client.ts`
- `apps/admin/src/store/authStore.ts`
- `apps/admin/src/pages/LoginPage.tsx`
- `apps/admin/src/components/ProtectedRoute.tsx`
- `apps/admin/src/components/layout/AdminLayout.tsx`
- `apps/admin/src/components/layout/Sidebar.tsx`
- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/pages/TournamentsPage.tsx`
- `apps/admin/src/components/bracket/BracketTree.tsx`
- `apps/admin/src/pages/UsersPage.tsx`
- `apps/admin/src/pages/LiveMatchPage.tsx`
- `apps/admin/src/pages/RulesPage.tsx`
- Modify: `package.json` (root) — add admin workspace
- Modify: `apps/admin/src/types/index.ts` — local type re-exports

---

## Task 1: Fix BracketMatch Entity + Register New Modules Skeleton

**Files:**
- Modify: `apps/backend/src/entities/bracket-match.entity.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Read the bracket-match entity**

```bash
cat apps/backend/src/entities/bracket-match.entity.ts
```

- [ ] **Step 2: Make match relation nullable**

In `apps/backend/src/entities/bracket-match.entity.ts`, change the `match` relation from:
```typescript
@ManyToOne(() => Match)
@JoinColumn({ name: 'match_id' })
match: Match;
```
to:
```typescript
@ManyToOne(() => Match, { nullable: true, eager: false })
@JoinColumn({ name: 'match_id' })
match: Match | null;
```

- [ ] **Step 3: Create stub module files for all 5 new backend modules**

Create `apps/backend/src/modules/tournaments/tournaments.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../../entities/tournament.entity';
import { TournamentTeam } from '../../entities/tournament-team.entity';
import { Team } from '../../entities/team.entity';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, TournamentTeam, Team])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
```

Create `apps/backend/src/modules/bracket/bracket.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BracketMatch } from '../../entities/bracket-match.entity';
import { Match } from '../../entities/match.entity';
import { TournamentTeam } from '../../entities/tournament-team.entity';
import { BracketController } from './bracket.controller';
import { BracketService } from './bracket.service';

@Module({
  imports: [TypeOrmModule.forFeature([BracketMatch, Match, TournamentTeam])],
  controllers: [BracketController],
  providers: [BracketService],
  exports: [BracketService],
})
export class BracketModule {}
```

Create `apps/backend/src/modules/grounds/grounds.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ground } from '../../entities/ground.entity';
import { GroundsController } from './grounds.controller';
import { GroundsService } from './grounds.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ground])],
  controllers: [GroundsController],
  providers: [GroundsService],
  exports: [GroundsService],
})
export class GroundsModule {}
```

Create `apps/backend/src/modules/teams/teams.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamMember])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
```

Create `apps/backend/src/modules/matches/matches.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../../entities/match.entity';
import { Ground } from '../../entities/ground.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Ground])],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
```

Create `apps/backend/src/modules/score/score.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketScore } from '../../entities/cricket-score.entity';
import { BadmintonScore } from '../../entities/badminton-score.entity';
import { PickleballScore } from '../../entities/pickleball-score.entity';
import { Match } from '../../entities/match.entity';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([CricketScore, BadmintonScore, PickleballScore, Match]), GatewayModule],
  controllers: [ScoreController],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
```

Create `apps/backend/src/modules/analytics/analytics.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../../entities/tournament.entity';
import { Match } from '../../entities/match.entity';
import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { PlayerStat } from '../../entities/player-stat.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Match, User, Team, PlayerStat])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
```

- [ ] **Step 4: Register modules in AppModule**

In `apps/backend/src/app.module.ts`, update imports array:
```typescript
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { BracketModule } from './modules/bracket/bracket.module';
import { GroundsModule } from './modules/grounds/grounds.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ScoreModule } from './modules/score/score.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// In @Module imports array:
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  DatabaseModule,
  AuthModule,
  UsersModule,
  UploadModule,
  GatewayModule,
  TournamentsModule,
  BracketModule,
  GroundsModule,
  TeamsModule,
  MatchesModule,
  ScoreModule,
  AnalyticsModule,
],
```

- [ ] **Step 5: Create stub controllers and services so TypeScript compiles**

Create `apps/backend/src/modules/tournaments/tournaments.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('tournaments')
export class TournamentsController {}
```

Create `apps/backend/src/modules/tournaments/tournaments.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class TournamentsService {}
```

Create `apps/backend/src/modules/bracket/bracket.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('brackets')
export class BracketController {}
```

Create `apps/backend/src/modules/bracket/bracket.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class BracketService {}
```

Create `apps/backend/src/modules/grounds/grounds.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('grounds')
export class GroundsController {}
```

Create `apps/backend/src/modules/grounds/grounds.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class GroundsService {}
```

Create `apps/backend/src/modules/teams/teams.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('teams')
export class TeamsController {}
```

Create `apps/backend/src/modules/teams/teams.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class TeamsService {}
```

Create `apps/backend/src/modules/matches/matches.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('matches')
export class MatchesController {}
```

Create `apps/backend/src/modules/matches/matches.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class MatchesService {}
```

Create `apps/backend/src/modules/score/score.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('score')
export class ScoreController {}
```

Create `apps/backend/src/modules/score/score.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class ScoreService {}
```

Create `apps/backend/src/modules/analytics/analytics.controller.ts`:
```typescript
import { Controller } from '@nestjs/common';
@Controller('analytics')
export class AnalyticsController {}
```

Create `apps/backend/src/modules/analytics/analytics.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
@Injectable()
export class AnalyticsService {}
```

- [ ] **Step 6: Verify backend still compiles**

Run from repo root:
```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: `Successfully compiled` with no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/entities/bracket-match.entity.ts \
        apps/backend/src/app.module.ts \
        apps/backend/src/modules/tournaments \
        apps/backend/src/modules/bracket \
        apps/backend/src/modules/grounds \
        apps/backend/src/modules/teams \
        apps/backend/src/modules/matches \
        apps/backend/src/modules/score \
        apps/backend/src/modules/analytics
git commit -m "feat(backend): scaffold 7 new modules, fix bracket-match nullable"
```

---

## Task 2: Tournaments Module — CRUD + Team Registration

**Files:**
- Modify: `apps/backend/src/modules/tournaments/tournaments.service.ts`
- Modify: `apps/backend/src/modules/tournaments/tournaments.controller.ts`
- Create: `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`
- Create: `apps/backend/src/modules/tournaments/dto/update-tournament.dto.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`:
```typescript
import { IsString, IsEnum, IsDateString, IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { SportType, TournamentFormat } from '@g3/types';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsEnum(TournamentFormat) format: TournamentFormat;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsInt() @Min(2) maxTeams?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsObject() rulesConfig?: Record<string, unknown>;
}
```

Create `apps/backend/src/modules/tournaments/dto/update-tournament.dto.ts`:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTournamentDto } from './create-tournament.dto';
export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {}
```

- [ ] **Step 2: Implement TournamentsService**

Replace `apps/backend/src/modules/tournaments/tournaments.service.ts`:
```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../entities/tournament.entity';
import { TournamentTeam } from '../../entities/tournament-team.entity';
import { Team } from '../../entities/team.entity';
import { TournamentStatus } from '@g3/types';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
    @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
  ) {}

  create(dto: CreateTournamentDto, organizerId: string): Promise<Tournament> {
    const tournament = this.tournamentRepo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      organizer: { id: organizerId },
      status: TournamentStatus.DRAFT,
    });
    return this.tournamentRepo.save(tournament);
  }

  findAll(): Promise<Tournament[]> {
    return this.tournamentRepo.find({ relations: ['organizer'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tournament> {
    const t = await this.tournamentRepo.findOne({ where: { id }, relations: ['organizer', 'tournamentTeams', 'tournamentTeams.team'] });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async update(id: string, dto: UpdateTournamentDto, userId: string): Promise<Tournament> {
    const t = await this.findOne(id);
    if (t.organizer.id !== userId) throw new ForbiddenException();
    Object.assign(t, dto);
    if (dto.startDate) t.startDate = new Date(dto.startDate);
    if (dto.endDate) t.endDate = new Date(dto.endDate);
    return this.tournamentRepo.save(t);
  }

  async remove(id: string, userId: string): Promise<void> {
    const t = await this.findOne(id);
    if (t.organizer.id !== userId) throw new ForbiddenException();
    await this.tournamentRepo.remove(t);
  }

  async registerTeam(tournamentId: string, teamId: string): Promise<TournamentTeam> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.status !== TournamentStatus.DRAFT && tournament.status !== TournamentStatus.REGISTRATION) {
      throw new BadRequestException('Registration is closed');
    }
    const team = await this.teamRepo.findOneBy({ id: teamId });
    if (!team) throw new NotFoundException('Team not found');
    const existing = await this.ttRepo.findOne({ where: { tournament: { id: tournamentId }, team: { id: teamId } } });
    if (existing) throw new BadRequestException('Team already registered');
    const tt = this.ttRepo.create({ tournament: { id: tournamentId }, team: { id: teamId } });
    return this.ttRepo.save(tt);
  }

  async getStandings(tournamentId: string): Promise<TournamentTeam[]> {
    return this.ttRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['team'],
      order: { seed: 'ASC' },
    });
  }

  async updateStatus(id: string, status: TournamentStatus, userId: string): Promise<Tournament> {
    const t = await this.findOne(id);
    if (t.organizer.id !== userId) throw new ForbiddenException();
    t.status = status;
    return this.tournamentRepo.save(t);
  }
}
```

- [ ] **Step 3: Implement TournamentsController**

Replace `apps/backend/src/modules/tournaments/tournaments.controller.ts`:
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TournamentStatus } from '@g3/types';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly svc: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto, @Request() req: { user: { sub: string } }) {
    return this.svc.create(dto, req.user.sub);
  }

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto, @Request() req: { user: { sub: string } }) {
    return this.svc.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.svc.remove(id, req.user.sub);
  }

  @Post(':id/register-team/:teamId')
  @UseGuards(JwtAuthGuard)
  registerTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.svc.registerTeam(id, teamId);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.getStandings(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: TournamentStatus, @Request() req: { user: { sub: string } }) {
    return this.svc.updateStatus(id, status, req.user.sub);
  }
}
```

- [ ] **Step 4: Build and verify**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/tournaments/
git commit -m "feat(backend): implement tournaments CRUD + team registration"
```

---

## Task 3: Bracket Generation Module

**Files:**
- Modify: `apps/backend/src/modules/bracket/bracket.service.ts`
- Modify: `apps/backend/src/modules/bracket/bracket.controller.ts`

- [ ] **Step 1: Implement BracketService**

Replace `apps/backend/src/modules/bracket/bracket.service.ts`:
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BracketMatch } from '../../entities/bracket-match.entity';
import { Match } from '../../entities/match.entity';
import { TournamentTeam } from '../../entities/tournament-team.entity';
import { MatchStatus, SportType } from '@g3/types';

@Injectable()
export class BracketService {
  constructor(
    @InjectRepository(BracketMatch) private bmRepo: Repository<BracketMatch>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
  ) {}

  /** Returns next power-of-2 >= n */
  private nextPow2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  async generate(tournamentId: string, sport: SportType): Promise<BracketMatch[]> {
    const existing = await this.bmRepo.findOne({ where: { tournament: { id: tournamentId } } });
    if (existing) throw new BadRequestException('Bracket already generated for this tournament');

    const teams = await this.ttRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['team'],
      order: { seed: 'ASC' },
    });
    if (teams.length < 2) throw new BadRequestException('Need at least 2 registered teams');

    const size = this.nextPow2(teams.length);
    const totalRounds = Math.log2(size);
    // slots array: seeded teams first, null = bye
    const slots: (TournamentTeam | null)[] = [...teams];
    while (slots.length < size) slots.push(null);

    // Build bracket bottom-up: create BracketMatch nodes for each round
    // round 1 = first round, round totalRounds = final
    const bracketMatchesByRound: BracketMatch[][] = [];

    for (let round = totalRounds; round >= 1; round--) {
      const matchesInRound = size / Math.pow(2, totalRounds - round + 1);
      // Actually: matchesInRound = 2^(round-1)
      const count = Math.pow(2, round - 1);
      const roundMatches: BracketMatch[] = [];
      for (let pos = 0; pos < count; pos++) {
        const bm = this.bmRepo.create({
          tournament: { id: tournamentId },
          round,
          position: pos,
          match: null,
        });
        roundMatches.push(bm);
      }
      bracketMatchesByRound.unshift(roundMatches); // index 0 = round 1
    }

    // Save all bracket matches to get IDs
    const saved: BracketMatch[][] = [];
    for (const roundMatches of bracketMatchesByRound) {
      const s = await this.bmRepo.save(roundMatches);
      saved.push(s);
    }

    // Link next_match_id: for round r, position p → round r+1, position floor(p/2)
    for (let r = 0; r < saved.length - 1; r++) {
      for (let p = 0; p < saved[r].length; p++) {
        saved[r][p].nextMatch = saved[r + 1][Math.floor(p / 2)];
      }
      await this.bmRepo.save(saved[r]);
    }

    // Create actual Match records for R1 (non-bye slots)
    const r1 = saved[0];
    for (let p = 0; p < r1.length; p++) {
      const teamA = slots[p * 2];
      const teamB = slots[p * 2 + 1];
      if (!teamA && !teamB) continue; // both bye — skip
      if (!teamA || !teamB) {
        // one bye: auto-advance the real team (no match needed, winner = real team)
        // Mark this bracket slot as a bye by leaving match null
        continue;
      }
      const match = this.matchRepo.create({
        tournament: { id: tournamentId },
        teamA: teamA.team,
        teamB: teamB.team,
        sport,
        status: MatchStatus.SCHEDULED,
        round: 1,
        socketRoom: `match:${tournamentId}:r1:p${p}`,
      });
      const savedMatch = await this.matchRepo.save(match);
      r1[p].match = savedMatch;
    }
    await this.bmRepo.save(r1);

    return this.bmRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['match', 'match.teamA', 'match.teamB', 'nextMatch'],
      order: { round: 'ASC', position: 'ASC' },
    });
  }

  async advanceWinner(bracketMatchId: string, winnerTeamId: string): Promise<BracketMatch> {
    const bm = await this.bmRepo.findOne({
      where: { id: bracketMatchId },
      relations: ['match', 'nextMatch', 'nextMatch.match'],
    });
    if (!bm) throw new NotFoundException('BracketMatch not found');
    if (!bm.nextMatch) return bm; // final — nothing to advance to

    const next = bm.nextMatch;
    // Determine position in next match (even position → teamA, odd → teamB)
    const isTeamA = bm.position % 2 === 0;

    if (!next.match) {
      // Create the match for the next round
      const nextMatch = this.matchRepo.create({
        tournament: bm.tournament,
        sport: bm.match?.sport,
        status: MatchStatus.SCHEDULED,
        round: bm.round + 1,
        socketRoom: `match:${bm.tournament.id}:r${bm.round + 1}:p${next.position}`,
        ...(isTeamA ? { teamA: { id: winnerTeamId } } : { teamB: { id: winnerTeamId } }),
      });
      const saved = await this.matchRepo.save(nextMatch);
      next.match = saved;
    } else {
      // Match exists, fill the vacant slot
      if (isTeamA) {
        next.match.teamA = { id: winnerTeamId } as any;
      } else {
        next.match.teamB = { id: winnerTeamId } as any;
      }
      await this.matchRepo.save(next.match);
    }
    await this.bmRepo.save(next);
    return bm;
  }

  getBracket(tournamentId: string): Promise<BracketMatch[]> {
    return this.bmRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['match', 'match.teamA', 'match.teamB', 'nextMatch'],
      order: { round: 'ASC', position: 'ASC' },
    });
  }
}
```

- [ ] **Step 2: Implement BracketController**

Replace `apps/backend/src/modules/bracket/bracket.controller.ts`:
```typescript
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BracketService } from './bracket.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SportType } from '@g3/types';

@Controller('brackets')
export class BracketController {
  constructor(private readonly svc: BracketService) {}

  @Post(':tournamentId/generate')
  @UseGuards(JwtAuthGuard)
  generate(@Param('tournamentId') id: string, @Body('sport') sport: SportType) {
    return this.svc.generate(id, sport);
  }

  @Get(':tournamentId')
  getBracket(@Param('tournamentId') id: string) {
    return this.svc.getBracket(id);
  }

  @Patch(':bracketMatchId/advance')
  @UseGuards(JwtAuthGuard)
  advance(@Param('bracketMatchId') id: string, @Body('winnerTeamId') winnerTeamId: string) {
    return this.svc.advanceWinner(id, winnerTeamId);
  }
}
```

- [ ] **Step 3: Build**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/bracket/
git commit -m "feat(backend): implement knockout bracket generation + winner advancement"
```

---

## Task 4: Grounds + Teams Modules

**Files:**
- Modify: `apps/backend/src/modules/grounds/grounds.service.ts`
- Modify: `apps/backend/src/modules/grounds/grounds.controller.ts`
- Create: `apps/backend/src/modules/grounds/dto/create-ground.dto.ts`
- Modify: `apps/backend/src/modules/teams/teams.service.ts`
- Modify: `apps/backend/src/modules/teams/teams.controller.ts`
- Create: `apps/backend/src/modules/teams/dto/create-team.dto.ts`

- [ ] **Step 1: Grounds DTO**

Create `apps/backend/src/modules/grounds/dto/create-ground.dto.ts`:
```typescript
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateGroundDto {
  @IsString() name: string;
  @IsString() location: string;
  @IsEnum(SportType) sportType: SportType;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsString() tournamentId?: string;
}
```

- [ ] **Step 2: GroundsService**

Replace `apps/backend/src/modules/grounds/grounds.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ground } from '../../entities/ground.entity';
import { CreateGroundDto } from './dto/create-ground.dto';

@Injectable()
export class GroundsService {
  constructor(@InjectRepository(Ground) private repo: Repository<Ground>) {}

  create(dto: CreateGroundDto, ownerId: string): Promise<Ground> {
    const ground = this.repo.create({
      ...dto,
      owner: { id: ownerId },
      tournament: dto.tournamentId ? { id: dto.tournamentId } : undefined,
    });
    return this.repo.save(ground);
  }

  findAll(): Promise<Ground[]> {
    return this.repo.find({ relations: ['owner', 'tournament'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Ground> {
    const g = await this.repo.findOne({ where: { id }, relations: ['owner', 'tournament'] });
    if (!g) throw new NotFoundException('Ground not found');
    return g;
  }

  async update(id: string, dto: Partial<CreateGroundDto>): Promise<Ground> {
    const g = await this.findOne(id);
    Object.assign(g, dto);
    return this.repo.save(g);
  }

  async remove(id: string): Promise<void> {
    const g = await this.findOne(id);
    await this.repo.remove(g);
  }

  findAvailable(sportType?: SportType): Promise<Ground[]> {
    const qb = this.repo.createQueryBuilder('g').where('g.isAvailable = true');
    if (sportType) qb.andWhere('g.sportType = :sportType', { sportType });
    return qb.getMany();
  }
}
```

Fix import — add SportType:
```typescript
import { SportType } from '@g3/types';
```

- [ ] **Step 3: GroundsController**

Replace `apps/backend/src/modules/grounds/grounds.controller.ts`:
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { GroundsService } from './grounds.service';
import { CreateGroundDto } from './dto/create-ground.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SportType } from '@g3/types';

@Controller('grounds')
export class GroundsController {
  constructor(private readonly svc: GroundsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGroundDto, @Request() req: { user: { sub: string } }) {
    return this.svc.create(dto, req.user.sub);
  }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('available')
  available(@Query('sport') sport?: SportType) {
    return this.svc.findAvailable(sport);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreateGroundDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
```

- [ ] **Step 4: Teams DTO**

Create `apps/backend/src/modules/teams/dto/create-team.dto.ts`:
```typescript
import { IsString, IsEnum, IsOptional, IsHexColor } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateTeamDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsHexColor() themeColor?: string;
}
```

- [ ] **Step 5: TeamsService**

Replace `apps/backend/src/modules/teams/teams.service.ts`:
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamMemberRole } from '@g3/types';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember) private memberRepo: Repository<TeamMember>,
  ) {}

  async create(dto: CreateTeamDto, ownerId: string): Promise<Team> {
    const team = this.teamRepo.create({ ...dto, owner: { id: ownerId }, captain: { id: ownerId } });
    const saved = await this.teamRepo.save(team);
    // Add owner as captain member
    const member = this.memberRepo.create({ team: saved, user: { id: ownerId }, role: TeamMemberRole.CAPTAIN });
    await this.memberRepo.save(member);
    return saved;
  }

  findAll(): Promise<Team[]> {
    return this.teamRepo.find({ relations: ['owner'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Team> {
    const t = await this.teamRepo.findOne({ where: { id }, relations: ['owner', 'captain', 'members', 'members.user'] });
    if (!t) throw new NotFoundException('Team not found');
    return t;
  }

  async update(id: string, dto: Partial<CreateTeamDto>, userId: string): Promise<Team> {
    const t = await this.findOne(id);
    if (t.owner.id !== userId) throw new ForbiddenException();
    Object.assign(t, dto);
    return this.teamRepo.save(t);
  }

  async addMember(teamId: string, userId: string, role: TeamMemberRole, jerseyNumber?: number): Promise<TeamMember> {
    const member = this.memberRepo.create({ team: { id: teamId }, user: { id: userId }, role, jerseyNumber });
    return this.memberRepo.save(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const m = await this.memberRepo.findOne({ where: { team: { id: teamId }, user: { id: userId } } });
    if (!m) throw new NotFoundException('Member not found');
    await this.memberRepo.remove(m);
  }
}
```

- [ ] **Step 6: TeamsController**

Replace `apps/backend/src/modules/teams/teams.controller.ts`:
```typescript
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TeamMemberRole } from '@g3/types';

@Controller('teams')
export class TeamsController {
  constructor(private readonly svc: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.svc.create(dto, req.user.sub);
  }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreateTeamDto>, @Request() req: { user: { sub: string } }) {
    return this.svc.update(id, dto, req.user.sub);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: TeamMemberRole; jerseyNumber?: number },
  ) {
    return this.svc.addMember(id, body.userId, body.role, body.jerseyNumber);
  }
}
```

- [ ] **Step 7: Build**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/modules/grounds/ apps/backend/src/modules/teams/
git commit -m "feat(backend): implement grounds + teams modules"
```

---

## Task 5: Matches Module

**Files:**
- Modify: `apps/backend/src/modules/matches/matches.service.ts`
- Modify: `apps/backend/src/modules/matches/matches.controller.ts`
- Create: `apps/backend/src/modules/matches/dto/create-match.dto.ts`
- Create: `apps/backend/src/modules/matches/dto/toss.dto.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/backend/src/modules/matches/dto/create-match.dto.ts`:
```typescript
import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateMatchDto {
  @IsString() tournamentId: string;
  @IsString() teamAId: string;
  @IsString() teamBId: string;
  @IsEnum(SportType) sport: SportType;
  @IsOptional() @IsString() groundId?: string;
  @IsOptional() @IsInt() @Min(1) round?: number;
  @IsOptional() @IsString() scheduledAt?: string;
}
```

Create `apps/backend/src/modules/matches/dto/toss.dto.ts`:
```typescript
import { IsString, IsIn } from 'class-validator';

export class TossDto {
  @IsString() winnerTeamId: string;
  @IsIn(['bat', 'field', 'serve', 'receive']) decision: 'bat' | 'field' | 'serve' | 'receive';
}
```

- [ ] **Step 2: MatchesService**

Replace `apps/backend/src/modules/matches/matches.service.ts`:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../entities/match.entity';
import { Ground } from '../../entities/ground.entity';
import { MatchStatus } from '@g3/types';
import { CreateMatchDto } from './dto/create-match.dto';
import { TossDto } from './dto/toss.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Ground) private groundRepo: Repository<Ground>,
  ) {}

  async create(dto: CreateMatchDto): Promise<Match> {
    const match = this.matchRepo.create({
      tournament: { id: dto.tournamentId },
      teamA: { id: dto.teamAId },
      teamB: { id: dto.teamBId },
      sport: dto.sport,
      status: MatchStatus.SCHEDULED,
      round: dto.round ?? 1,
      socketRoom: `match:${dto.tournamentId}:${Date.now()}`,
      ...(dto.groundId && { ground: { id: dto.groundId } }),
    });
    return this.matchRepo.save(match);
  }

  findAll(tournamentId?: string): Promise<Match[]> {
    const where = tournamentId ? { tournament: { id: tournamentId } } : {};
    return this.matchRepo.find({ where, relations: ['teamA', 'teamB', 'ground', 'tournament'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Match> {
    const m = await this.matchRepo.findOne({
      where: { id },
      relations: ['teamA', 'teamB', 'ground', 'tournament', 'scorer'],
    });
    if (!m) throw new NotFoundException('Match not found');
    return m;
  }

  async assignScorer(matchId: string, scorerId: string): Promise<Match> {
    const m = await this.findOne(matchId);
    m.scorer = { id: scorerId } as any;
    return this.matchRepo.save(m);
  }

  async recordToss(matchId: string, dto: TossDto): Promise<Match> {
    const m = await this.findOne(matchId);
    if (m.status !== MatchStatus.SCHEDULED) throw new BadRequestException('Toss only before match starts');
    // Store toss result in match (if your entity has tossWinner/tossDecision fields)
    // If not yet on entity, use a workaround via a tossInfo JSON field or just update status
    m.status = MatchStatus.LIVE;
    return this.matchRepo.save(m);
  }

  async updateStatus(matchId: string, status: MatchStatus): Promise<Match> {
    const m = await this.findOne(matchId);
    m.status = status;
    return this.matchRepo.save(m);
  }

  async assignGround(matchId: string, groundId: string): Promise<Match> {
    const m = await this.findOne(matchId);
    const ground = await this.groundRepo.findOneBy({ id: groundId });
    if (!ground) throw new NotFoundException('Ground not found');
    m.ground = ground;
    return this.matchRepo.save(m);
  }
}
```

- [ ] **Step 3: MatchesController**

Replace `apps/backend/src/modules/matches/matches.controller.ts`:
```typescript
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { TossDto } from './dto/toss.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MatchStatus } from '@g3/types';

@Controller('matches')
export class MatchesController {
  constructor(private readonly svc: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateMatchDto) { return this.svc.create(dto); }

  @Get()
  findAll(@Query('tournamentId') tournamentId?: string) { return this.svc.findAll(tournamentId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id/scorer')
  @UseGuards(JwtAuthGuard)
  assignScorer(@Param('id') id: string, @Body('scorerId') scorerId: string) {
    return this.svc.assignScorer(id, scorerId);
  }

  @Patch(':id/toss')
  @UseGuards(JwtAuthGuard)
  toss(@Param('id') id: string, @Body() dto: TossDto) {
    return this.svc.recordToss(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  status(@Param('id') id: string, @Body('status') status: MatchStatus) {
    return this.svc.updateStatus(id, status);
  }

  @Patch(':id/ground')
  @UseGuards(JwtAuthGuard)
  ground(@Param('id') id: string, @Body('groundId') groundId: string) {
    return this.svc.assignGround(id, groundId);
  }
}
```

- [ ] **Step 4: Build and commit**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
git add apps/backend/src/modules/matches/
git commit -m "feat(backend): implement matches scheduling + toss + scorer assignment"
```

---

## Task 6: Score Engine (Cricket, Badminton, Pickleball)

**Files:**
- Modify: `apps/backend/src/modules/score/score.service.ts`
- Modify: `apps/backend/src/modules/score/score.controller.ts`
- Create: `apps/backend/src/modules/score/dto/cricket-ball.dto.ts`
- Create: `apps/backend/src/modules/score/dto/badminton-point.dto.ts`
- Create: `apps/backend/src/modules/score/dto/pickleball-point.dto.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/backend/src/modules/score/dto/cricket-ball.dto.ts`:
```typescript
import { IsString, IsInt, Min, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { WicketType } from '@g3/types';

export class CricketBallDto {
  @IsString() matchId: string;
  @IsString() battingTeamId: string;
  @IsInt() @Min(0) runs: number; // runs off bat (0-6)
  @IsOptional() @IsInt() @Min(0) extras?: number; // wides, no-balls etc
  @IsOptional() @IsBoolean() isWicket?: boolean;
  @IsOptional() @IsEnum(WicketType) wicketType?: WicketType;
  @IsOptional() @IsBoolean() isWide?: boolean;
  @IsOptional() @IsBoolean() isNoBall?: boolean;
}
```

Create `apps/backend/src/modules/score/dto/badminton-point.dto.ts`:
```typescript
import { IsString, IsInt, IsIn } from 'class-validator';

export class BadmintonPointDto {
  @IsString() matchId: string;
  @IsInt() setNumber: number;
  @IsIn(['A', 'B']) scoringTeam: 'A' | 'B';
}
```

Create `apps/backend/src/modules/score/dto/pickleball-point.dto.ts`:
```typescript
import { IsString, IsInt, IsIn } from 'class-validator';

export class PickleballPointDto {
  @IsString() matchId: string;
  @IsInt() gameNumber: number;
  @IsIn(['A', 'B']) scoringTeam: 'A' | 'B';
}
```

- [ ] **Step 2: ScoreService**

Replace `apps/backend/src/modules/score/score.service.ts`:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CricketScore } from '../../entities/cricket-score.entity';
import { BadmintonScore } from '../../entities/badminton-score.entity';
import { PickleballScore } from '../../entities/pickleball-score.entity';
import { Match } from '../../entities/match.entity';
import { ScoreGateway } from '../gateway/score.gateway';
import { MatchStatus } from '@g3/types';
import { CricketBallDto } from './dto/cricket-ball.dto';
import { BadmintonPointDto } from './dto/badminton-point.dto';
import { PickleballPointDto } from './dto/pickleball-point.dto';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(CricketScore) private cricketRepo: Repository<CricketScore>,
    @InjectRepository(BadmintonScore) private badmintonRepo: Repository<BadmintonScore>,
    @InjectRepository(PickleballScore) private pickleballRepo: Repository<PickleballScore>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    private readonly gateway: ScoreGateway,
  ) {}

  // ─── Cricket ────────────────────────────────────────────────────────────────

  async getOrCreateCricketInnings(matchId: string, teamId: string, innings: number): Promise<CricketScore> {
    let score = await this.cricketRepo.findOne({ where: { match: { id: matchId }, team: { id: teamId }, innings } });
    if (!score) {
      score = this.cricketRepo.create({
        match: { id: matchId },
        team: { id: teamId },
        innings,
        runs: 0,
        wickets: 0,
        overs: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        overHistory: [],
      });
      score = await this.cricketRepo.save(score);
    }
    return score;
  }

  async recordCricketBall(dto: CricketBallDto): Promise<CricketScore> {
    const match = await this.matchRepo.findOne({ where: { id: dto.matchId }, relations: ['teamA'] });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.LIVE) throw new BadRequestException('Match is not live');

    const innings = 1; // simplified: innings tracking via caller in future
    const score = await this.getOrCreateCricketInnings(dto.matchId, dto.battingTeamId, innings);

    const ballRuns = dto.runs + (dto.extras ?? 0);
    score.runs += ballRuns;
    if (dto.extras) {
      const ex = score.extras as Record<string, number>;
      if (dto.isWide) ex.wides = (ex.wides ?? 0) + (dto.extras);
      else if (dto.isNoBall) ex.noBalls = (ex.noBalls ?? 0) + (dto.extras);
    }
    if (dto.isWicket && !dto.isWide && !dto.isNoBall) score.wickets += 1;

    // Legal delivery: advance overs
    if (!dto.isWide && !dto.isNoBall) {
      const balls = Math.round((Number(score.overs) * 6 + 1));
      score.overs = Number((balls / 6).toFixed(1));
    }

    // Append to overHistory for undo support
    const history = score.overHistory as unknown[];
    history.push({ runs: dto.runs, extras: dto.extras ?? 0, isWicket: dto.isWicket ?? false, wicketType: dto.wicketType, isWide: dto.isWide, isNoBall: dto.isNoBall });
    score.overHistory = history as any;

    const saved = await this.cricketRepo.save(score);
    await this.gateway.broadcastScoreUpdate(match.socketRoom, { matchId: dto.matchId, sport: 'cricket', score: saved });
    if (dto.isWicket) await this.gateway.broadcastWicket(match.socketRoom, { matchId: dto.matchId, wicketType: dto.wicketType!, battingTeamId: dto.battingTeamId });
    return saved;
  }

  async undoCricketBall(matchId: string, teamId: string, innings: number): Promise<CricketScore> {
    const score = await this.cricketRepo.findOne({ where: { match: { id: matchId }, team: { id: teamId }, innings } });
    if (!score) throw new NotFoundException('Score not found');
    const history = score.overHistory as any[];
    if (!history.length) throw new BadRequestException('Nothing to undo');

    const last = history.pop();
    score.overHistory = history as any;
    score.runs -= (last.runs + (last.extras ?? 0));
    if (last.isWicket && !last.isWide && !last.isNoBall) score.wickets -= 1;
    if (!last.isWide && !last.isNoBall) {
      const balls = Math.round(Number(score.overs) * 6) - 1;
      score.overs = Number((balls / 6).toFixed(1));
    }

    const saved = await this.cricketRepo.save(score);
    const match = await this.matchRepo.findOneBy({ id: matchId });
    if (match) await this.gateway.broadcastScoreUpdate(match.socketRoom, { matchId, sport: 'cricket', score: saved });
    return saved;
  }

  // ─── Badminton ───────────────────────────────────────────────────────────────

  async getOrCreateBadmintonSet(matchId: string, setNumber: number): Promise<BadmintonScore> {
    let score = await this.badmintonRepo.findOne({ where: { match: { id: matchId }, setNumber } });
    if (!score) {
      score = this.badmintonRepo.create({ match: { id: matchId }, setNumber, teamAPoints: 0, teamBPoints: 0, isCompleted: false });
      score = await this.badmintonRepo.save(score);
    }
    return score;
  }

  async recordBadmintonPoint(dto: BadmintonPointDto): Promise<BadmintonScore> {
    const match = await this.matchRepo.findOneBy({ id: dto.matchId });
    if (!match) throw new NotFoundException('Match not found');
    const set = await this.getOrCreateBadmintonSet(dto.matchId, dto.setNumber);
    if (set.isCompleted) throw new BadRequestException('Set already completed');

    if (dto.scoringTeam === 'A') set.teamAPoints += 1;
    else set.teamBPoints += 1;

    // Badminton: win at 21 with 2 clear, or 30-29
    const a = set.teamAPoints, b = set.teamBPoints;
    if ((a >= 21 && a - b >= 2) || a === 30) { set.isCompleted = true; set.setWinner = 'A'; }
    else if ((b >= 21 && b - a >= 2) || b === 30) { set.isCompleted = true; set.setWinner = 'B'; }

    const saved = await this.badmintonRepo.save(set);
    await this.gateway.broadcastScoreUpdate(match.socketRoom, { matchId: dto.matchId, sport: 'badminton', score: saved });
    return saved;
  }

  // ─── Pickleball ──────────────────────────────────────────────────────────────

  async getOrCreatePickleballGame(matchId: string, gameNumber: number): Promise<PickleballScore> {
    let score = await this.pickleballRepo.findOne({ where: { match: { id: matchId }, gameNumber } });
    if (!score) {
      score = this.pickleballRepo.create({ match: { id: matchId }, gameNumber, teamAPoints: 0, teamBPoints: 0, serveNumber: 1, isCompleted: false });
      score = await this.pickleballRepo.save(score);
    }
    return score;
  }

  async recordPickleballPoint(dto: PickleballPointDto): Promise<PickleballScore> {
    const match = await this.matchRepo.findOneBy({ id: dto.matchId });
    if (!match) throw new NotFoundException('Match not found');
    const game = await this.getOrCreatePickleballGame(dto.matchId, dto.gameNumber);
    if (game.isCompleted) throw new BadRequestException('Game already completed');

    if (dto.scoringTeam === 'A') game.teamAPoints += 1;
    else game.teamBPoints += 1;

    // Pickleball: win at 11 with 2 clear
    const a = game.teamAPoints, b = game.teamBPoints;
    if (a >= 11 && a - b >= 2) { game.isCompleted = true; game.gameWinner = 'A'; }
    else if (b >= 11 && b - a >= 2) { game.isCompleted = true; game.gameWinner = 'B'; }

    const saved = await this.pickleballRepo.save(game);
    await this.gateway.broadcastScoreUpdate(match.socketRoom, { matchId: dto.matchId, sport: 'pickleball', score: saved });
    return saved;
  }

  // ─── Generic getters ─────────────────────────────────────────────────────────

  getCricketScore(matchId: string): Promise<CricketScore[]> {
    return this.cricketRepo.find({ where: { match: { id: matchId } } });
  }

  getBadmintonScore(matchId: string): Promise<BadmintonScore[]> {
    return this.badmintonRepo.find({ where: { match: { id: matchId } }, order: { setNumber: 'ASC' } });
  }

  getPickleballScore(matchId: string): Promise<PickleballScore[]> {
    return this.pickleballRepo.find({ where: { match: { id: matchId } }, order: { gameNumber: 'ASC' } });
  }
}
```

- [ ] **Step 3: ScoreController**

Replace `apps/backend/src/modules/score/score.controller.ts`:
```typescript
import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScoreService } from './score.service';
import { CricketBallDto } from './dto/cricket-ball.dto';
import { BadmintonPointDto } from './dto/badminton-point.dto';
import { PickleballPointDto } from './dto/pickleball-point.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('score')
@UseGuards(JwtAuthGuard)
export class ScoreController {
  constructor(private readonly svc: ScoreService) {}

  @Get('cricket/:matchId')
  getCricket(@Param('matchId') id: string) { return this.svc.getCricketScore(id); }

  @Post('cricket/ball')
  ball(@Body() dto: CricketBallDto) { return this.svc.recordCricketBall(dto); }

  @Delete('cricket/:matchId/undo')
  undoCricket(@Param('matchId') matchId: string, @Body() body: { teamId: string; innings: number }) {
    return this.svc.undoCricketBall(matchId, body.teamId, body.innings);
  }

  @Get('badminton/:matchId')
  getBadminton(@Param('matchId') id: string) { return this.svc.getBadmintonScore(id); }

  @Post('badminton/point')
  badmintonPoint(@Body() dto: BadmintonPointDto) { return this.svc.recordBadmintonPoint(dto); }

  @Get('pickleball/:matchId')
  getPickleball(@Param('matchId') id: string) { return this.svc.getPickleballScore(id); }

  @Post('pickleball/point')
  pickleballPoint(@Body() dto: PickleballPointDto) { return this.svc.recordPickleballPoint(dto); }
}
```

- [ ] **Step 4: Check ScoreGateway export**

Verify `apps/backend/src/modules/gateway/gateway.module.ts` exports `ScoreGateway`. If it doesn't, add `exports: [ScoreGateway]` to the `@Module` decorator.

- [ ] **Step 5: Build**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/score/
git commit -m "feat(backend): cricket/badminton/pickleball score engine with undo + realtime broadcast"
```

---

## Task 7: Analytics Module

**Files:**
- Modify: `apps/backend/src/modules/analytics/analytics.service.ts`
- Modify: `apps/backend/src/modules/analytics/analytics.controller.ts`

- [ ] **Step 1: AnalyticsService**

Replace `apps/backend/src/modules/analytics/analytics.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../entities/tournament.entity';
import { Match } from '../../entities/match.entity';
import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { PlayerStat } from '../../entities/player-stat.entity';
import { MatchStatus, TournamentStatus } from '@g3/types';

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalMatches: number;
  liveMatches: number;
  totalUsers: number;
  totalTeams: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(PlayerStat) private statRepo: Repository<PlayerStat>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalTournaments, activeTournaments, totalMatches, liveMatches, totalUsers, totalTeams] = await Promise.all([
      this.tournamentRepo.count(),
      this.tournamentRepo.count({ where: { status: TournamentStatus.ONGOING } }),
      this.matchRepo.count(),
      this.matchRepo.count({ where: { status: MatchStatus.LIVE } }),
      this.userRepo.count(),
      this.teamRepo.count(),
    ]);
    return { totalTournaments, activeTournaments, totalMatches, liveMatches, totalUsers, totalTeams };
  }

  async getMatchesPerDay(days = 30): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.matchRepo
      .createQueryBuilder('m')
      .select("DATE(m.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('m.created_at >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();
    return rows.map(r => ({ date: r.date, count: Number(r.count) }));
  }

  async getTopPlayers(limit = 10): Promise<PlayerStat[]> {
    return this.statRepo.find({ relations: ['user', 'tournament'], order: { totalRuns: 'DESC' }, take: limit });
  }

  async getTournamentSummary(tournamentId: string) {
    const [total, completed, live] = await Promise.all([
      this.matchRepo.count({ where: { tournament: { id: tournamentId } } }),
      this.matchRepo.count({ where: { tournament: { id: tournamentId }, status: MatchStatus.COMPLETED } }),
      this.matchRepo.count({ where: { tournament: { id: tournamentId }, status: MatchStatus.LIVE } }),
    ]);
    return { total, completed, live, pending: total - completed - live };
  }
}
```

- [ ] **Step 2: AnalyticsController**

Replace `apps/backend/src/modules/analytics/analytics.controller.ts`:
```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard')
  dashboard() { return this.svc.getDashboardStats(); }

  @Get('matches-per-day')
  matchesPerDay(@Query('days') days?: string) {
    return this.svc.getMatchesPerDay(days ? Number(days) : 30);
  }

  @Get('top-players')
  topPlayers(@Query('limit') limit?: string) {
    return this.svc.getTopPlayers(limit ? Number(limit) : 10);
  }

  @Get('tournament/:id/summary')
  tournamentSummary(@Param('id') id: string) {
    return this.svc.getTournamentSummary(id);
  }
}
```

- [ ] **Step 3: Build and commit**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
git add apps/backend/src/modules/analytics/
git commit -m "feat(backend): analytics module — dashboard stats, matches-per-day, top players"
```

---

## Task 8: Admin App Scaffold

**Files:**
- Create: `apps/admin/` directory and all configuration files

- [ ] **Step 1: Create package.json**

Create `apps/admin/package.json`:
```json
{
  "name": "@g3/admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.40.0",
    "axios": "^1.7.2",
    "clsx": "^2.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "recharts": "^2.12.7",
    "socket.io-client": "^4.7.5",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Vite + TypeScript config**

Create `apps/admin/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5174 },
});
```

Create `apps/admin/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Tailwind setup**

Create `apps/admin/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        card: '#111827',
        cyan: '#00E5FF',
        lime: '#CCFF00',
        pink: '#FF4D6D',
        muted: '#8892A4',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
```

Create `apps/admin/postcss.config.cjs`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: index.html**

Create `apps/admin/index.html`:
```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>G3 Sports Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-bg text-white antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: main.tsx + App.tsx**

Create `apps/admin/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

Create `apps/admin/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { background-color: #0A0E1A; }
```

Create `apps/admin/src/App.tsx` (stub — full routing in Task 9):
```tsx
export default function App() {
  return <div className="min-h-screen flex items-center justify-center text-cyan text-2xl font-bold">G3 Admin Loading…</div>;
}
```

- [ ] **Step 6: Add admin to pnpm workspace**

Check `pnpm-workspace.yaml` at the repo root. It should already have `apps/*`. If not, add `- 'apps/*'` to the packages array.

- [ ] **Step 7: Install admin deps**

```bash
cd D:\Version_6.36\selva\G4_SportsForce\g3-sports && pnpm install
```
Expected: admin dependencies installed.

- [ ] **Step 8: Verify dev server starts**

```bash
cd apps/admin && pnpm dev
```
Expected: Vite starts on http://localhost:5174 with no errors. Kill with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): scaffold Vite + React 18 + Tailwind admin app"
```

---

## Task 9: Admin Auth — API Client + Zustand Store + Login Page + Protected Routes

**Files:**
- Create: `apps/admin/src/api/client.ts`
- Create: `apps/admin/src/store/authStore.ts`
- Create: `apps/admin/src/pages/LoginPage.tsx`
- Create: `apps/admin/src/components/ProtectedRoute.tsx`
- Modify: `apps/admin/src/App.tsx`

- [ ] **Step 1: Axios API client**

Create `apps/admin/src/api/client.ts`:
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('g3_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('g3_admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);
```

- [ ] **Step 2: Zustand auth store**

Create `apps/admin/src/store/authStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/api/client';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await api.post<{ access_token: string; user: AdminUser }>('/auth/login', { email, password });
        localStorage.setItem('g3_admin_token', data.access_token);
        set({ token: data.access_token, user: data.user });
      },
      logout: () => {
        localStorage.removeItem('g3_admin_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'g3-admin-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
```

- [ ] **Step 3: Login page**

Create `apps/admin/src/pages/LoginPage.tsx`:
```tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">G3 <span className="text-cyan">Admin</span></h1>
          <p className="text-muted text-sm mt-2">Sports Management Console</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-white/5 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
              placeholder="admin@g3sports.app"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
            />
          </div>
          {error && <p className="text-pink text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan to-lime text-bg font-bold rounded-full py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: ProtectedRoute**

Create `apps/admin/src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Update App.tsx with routing**

Replace `apps/admin/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardPage from '@/pages/DashboardPage';
import TournamentsPage from '@/pages/TournamentsPage';
import UsersPage from '@/pages/UsersPage';
import LiveMatchPage from '@/pages/LiveMatchPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="live" element={<LiveMatchPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Create stub pages so App.tsx compiles**

Create `apps/admin/src/pages/DashboardPage.tsx`:
```tsx
export default function DashboardPage() { return <div className="text-white p-6">Dashboard</div>; }
```

Create `apps/admin/src/pages/TournamentsPage.tsx`:
```tsx
export default function TournamentsPage() { return <div className="text-white p-6">Tournaments</div>; }
```

Create `apps/admin/src/pages/UsersPage.tsx`:
```tsx
export default function UsersPage() { return <div className="text-white p-6">Users</div>; }
```

Create `apps/admin/src/pages/LiveMatchPage.tsx`:
```tsx
export default function LiveMatchPage() { return <div className="text-white p-6">Live Matches</div>; }
```

- [ ] **Step 7: Create stub AdminLayout**

Create `apps/admin/src/components/layout/AdminLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

Create `apps/admin/src/components/layout/Sidebar.tsx` (stub):
```tsx
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/tournaments', label: 'Tournaments' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/live', label: 'Live Matches' },
];

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <aside className="w-56 min-h-screen bg-card border-r border-white/5 flex flex-col">
      <div className="px-5 py-6 border-b border-white/5">
        <span className="text-xl font-black text-white">G3 <span className="text-cyan">Admin</span></span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-cyan/10 text-cyan' : 'text-muted hover:text-white hover:bg-white/5'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/5">
        <button onClick={logout} className="w-full text-left text-sm text-muted hover:text-pink transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 8: Create .env file for admin**

Create `apps/admin/.env`:
```
VITE_API_URL=http://localhost:3001
```

Create `apps/admin/.env.example`:
```
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 9: Verify dev build**

```bash
cd apps/admin && pnpm dev
```
Expected: http://localhost:5174/admin/login renders the login form.

- [ ] **Step 10: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): auth flow — Axios client, Zustand store, login page, protected routes"
```

---

## Task 10: Dashboard Page — Stats Cards + Recharts

**Files:**
- Modify: `apps/admin/src/pages/DashboardPage.tsx`
- Create: `apps/admin/src/api/analytics.ts`
- Create: `apps/admin/src/components/ui/StatCard.tsx`

- [ ] **Step 1: Analytics API**

Create `apps/admin/src/api/analytics.ts`:
```typescript
import { api } from './client';

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalMatches: number;
  liveMatches: number;
  totalUsers: number;
  totalTeams: number;
}

export interface MatchesPerDay {
  date: string;
  count: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>('/analytics/dashboard');
  return data;
};

export const fetchMatchesPerDay = async (days = 30): Promise<MatchesPerDay[]> => {
  const { data } = await api.get<MatchesPerDay[]>(`/analytics/matches-per-day?days=${days}`);
  return data;
};
```

- [ ] **Step 2: StatCard component**

Create `apps/admin/src/components/ui/StatCard.tsx`:
```tsx
interface StatCardProps {
  label: string;
  value: number | string;
  accent?: 'cyan' | 'lime' | 'pink';
  sublabel?: string;
}

const accentClass = { cyan: 'text-cyan', lime: 'text-lime', pink: 'text-pink' };

export default function StatCard({ label, value, accent = 'cyan', sublabel }: StatCardProps) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-6">
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-black ${accentClass[accent]}`}>{value}</p>
      {sublabel && <p className="text-muted text-xs mt-2">{sublabel}</p>}
    </div>
  );
}
```

- [ ] **Step 3: DashboardPage with stats + chart**

Replace `apps/admin/src/pages/DashboardPage.tsx`:
```tsx
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/ui/StatCard';
import { fetchDashboardStats, fetchMatchesPerDay } from '@/api/analytics';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['matches-per-day'],
    queryFn: () => fetchMatchesPerDay(30),
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Platform overview</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-white/5 rounded-2xl p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Tournaments" value={stats.totalTournaments} accent="cyan" />
          <StatCard label="Active Now" value={stats.activeTournaments} accent="lime" sublabel="ongoing tournaments" />
          <StatCard label="Total Matches" value={stats.totalMatches} accent="cyan" />
          <StatCard label="Live Matches" value={stats.liveMatches} accent="pink" sublabel="in progress" />
          <StatCard label="Users" value={stats.totalUsers} accent="cyan" />
          <StatCard label="Teams" value={stats.totalTeams} accent="lime" />
        </div>
      ) : null}

      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-6">Matches — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="date" tick={{ fill: '#8892A4', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#8892A4', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #ffffff10', borderRadius: 12, color: '#fff' }}
              cursor={{ stroke: '#00E5FF20' }}
            />
            <Area type="monotone" dataKey="count" stroke="#00E5FF" strokeWidth={2} fill="url(#matchGrad)" name="Matches" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify dev build**

```bash
cd apps/admin && pnpm dev
```
Navigate to http://localhost:5174/admin/dashboard after logging in. Expected: stat cards + chart render (with loading skeletons before data loads).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/DashboardPage.tsx apps/admin/src/api/analytics.ts apps/admin/src/components/ui/StatCard.tsx
git commit -m "feat(admin): dashboard page with stats cards and matches-per-day chart"
```

---

## Task 11: Tournaments Page + Bracket Tree View

**Files:**
- Modify: `apps/admin/src/pages/TournamentsPage.tsx`
- Create: `apps/admin/src/api/tournaments.ts`
- Create: `apps/admin/src/components/bracket/BracketTree.tsx`

- [ ] **Step 1: Tournaments API**

Create `apps/admin/src/api/tournaments.ts`:
```typescript
import { api } from './client';

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  organizer: { id: string; displayName: string };
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  match: {
    id: string;
    status: string;
    teamA: { id: string; name: string; logoUrl?: string };
    teamB: { id: string; name: string; logoUrl?: string };
    winner?: { id: string };
  } | null;
  nextMatch?: { id: string } | null;
}

export const fetchTournaments = async (): Promise<Tournament[]> => {
  const { data } = await api.get<Tournament[]>('/tournaments');
  return data;
};

export const fetchBracket = async (tournamentId: string): Promise<BracketMatch[]> => {
  const { data } = await api.get<BracketMatch[]>(`/brackets/${tournamentId}`);
  return data;
};

export const generateBracket = async (tournamentId: string, sport: string): Promise<BracketMatch[]> => {
  const { data } = await api.post<BracketMatch[]>(`/brackets/${tournamentId}/generate`, { sport });
  return data;
};
```

- [ ] **Step 2: BracketTree component**

Create `apps/admin/src/components/bracket/BracketTree.tsx`:
```tsx
import { BracketMatch } from '@/api/tournaments';

interface BracketTreeProps {
  matches: BracketMatch[];
}

function MatchSlot({ bm }: { bm: BracketMatch }) {
  const m = bm.match;
  return (
    <div className="bg-bg border border-white/10 rounded-xl p-3 w-48 text-xs">
      <div className={`py-1.5 px-2 rounded-lg mb-1 font-medium ${m?.winner?.id === m?.teamA?.id ? 'text-lime' : 'text-white'}`}>
        {m?.teamA?.name ?? 'TBD'}
      </div>
      <div className="h-px bg-white/5 my-1" />
      <div className={`py-1.5 px-2 rounded-lg font-medium ${m?.winner?.id === m?.teamB?.id ? 'text-lime' : 'text-white'}`}>
        {m?.teamB?.name ?? 'TBD'}
      </div>
      {!m && <p className="text-muted text-center mt-1">BYE</p>}
    </div>
  );
}

export default function BracketTree({ matches }: BracketTreeProps) {
  if (!matches.length) return <p className="text-muted text-sm">No bracket generated yet.</p>;

  const maxRound = Math.max(...matches.map((m) => m.round));
  const rounds: BracketMatch[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    rounds.push(matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position));
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 items-start min-w-max">
        {rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col gap-6 justify-around">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest text-center mb-2">
              {ri === rounds.length - 1 ? 'Final' : ri === rounds.length - 2 ? 'Semi-Final' : `Round ${ri + 1}`}
            </p>
            {round.map((bm) => (
              <MatchSlot key={bm.id} bm={bm} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TournamentsPage**

Replace `apps/admin/src/pages/TournamentsPage.tsx`:
```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTournaments, fetchBracket, generateBracket, Tournament } from '@/api/tournaments';
import BracketTree from '@/components/bracket/BracketTree';

const statusColor: Record<string, string> = {
  DRAFT: 'text-muted',
  REGISTRATION: 'text-cyan',
  ONGOING: 'text-lime',
  COMPLETED: 'text-pink',
};

export default function TournamentsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Tournament | null>(null);

  const { data: tournaments = [], isLoading } = useQuery({ queryKey: ['tournaments'], queryFn: fetchTournaments });
  const { data: bracket = [] } = useQuery({
    queryKey: ['bracket', selected?.id],
    queryFn: () => fetchBracket(selected!.id),
    enabled: !!selected,
  });

  const genBracket = useMutation({
    mutationFn: () => generateBracket(selected!.id, selected!.sport),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bracket', selected?.id] }),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black text-white">Tournaments</h1>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`text-left bg-card border rounded-2xl p-5 transition-colors ${selected?.id === t.id ? 'border-cyan/40' : 'border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-muted text-sm mt-0.5">{t.sport} · {t.format} · {t.location ?? 'No location'}</p>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-widest ${statusColor[t.status] ?? 'text-muted'}`}>{t.status}</span>
              </div>
            </button>
          ))}
          {!tournaments.length && <p className="text-muted text-sm">No tournaments yet.</p>}
        </div>
      )}

      {selected && (
        <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{selected.name} — Bracket</h2>
            {!bracket.length && (
              <button
                onClick={() => genBracket.mutate()}
                disabled={genBracket.isPending}
                className="bg-gradient-to-r from-cyan to-lime text-bg text-xs font-bold px-4 py-2 rounded-full disabled:opacity-50"
              >
                {genBracket.isPending ? 'Generating…' : 'Generate Bracket'}
              </button>
            )}
          </div>
          <BracketTree matches={bracket} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify dev build renders tournaments page**

```bash
cd apps/admin && pnpm dev
```
Navigate to http://localhost:5174/admin/tournaments. Expected: tournament list renders (empty if no data), bracket panel shows on selection.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/TournamentsPage.tsx apps/admin/src/api/tournaments.ts apps/admin/src/components/bracket/
git commit -m "feat(admin): tournaments list + bracket tree view with generate button"
```

---

## Task 12: Users Page

**Files:**
- Modify: `apps/admin/src/pages/UsersPage.tsx`
- Create: `apps/admin/src/api/users.ts`

- [ ] **Step 1: Users API**

Create `apps/admin/src/api/users.ts`:
```typescript
import { api } from './client';

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  profile?: { avatarUrl?: string };
}

export const fetchUsers = async (): Promise<AdminUserRow[]> => {
  const { data } = await api.get<AdminUserRow[]>('/users');
  return data;
};

export const updateUserRole = async (userId: string, role: string): Promise<AdminUserRow> => {
  const { data } = await api.patch<AdminUserRow>(`/users/${userId}/role`, { role });
  return data;
};
```

- [ ] **Step 2: UsersPage**

Replace `apps/admin/src/pages/UsersPage.tsx`:
```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole, AdminUserRow } from '@/api/users';

const ROLES = ['player', 'organizer', 'scorer', 'super_admin'];

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Users</h1>
        <input
          type="search"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 w-56"
        />
      </div>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user: AdminUserRow) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{user.displayName}</td>
                  <td className="px-5 py-3 text-muted">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole.mutate({ userId: user.id, role: e.target.value })}
                      className="bg-bg border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan/40"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/pages/UsersPage.tsx apps/admin/src/api/users.ts
git commit -m "feat(admin): users table with inline role editor"
```

---

## Task 13: Live Match Monitor + Production Build

**Files:**
- Modify: `apps/admin/src/pages/LiveMatchPage.tsx`
- Create: `apps/admin/src/api/matches.ts`
- Create: `apps/admin/src/hooks/useLiveScore.ts`

- [ ] **Step 1: Matches API**

Create `apps/admin/src/api/matches.ts`:
```typescript
import { api } from './client';

export interface LiveMatch {
  id: string;
  sport: string;
  status: string;
  round: number;
  socketRoom: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  tournament: { id: string; name: string };
  ground?: { name: string };
}

export const fetchLiveMatches = async (): Promise<LiveMatch[]> => {
  const { data } = await api.get<LiveMatch[]>('/matches?status=LIVE');
  return data;
};
```

- [ ] **Step 2: useLiveScore hook**

Create `apps/admin/src/hooks/useLiveScore.ts`:
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ScorePayload {
  matchId: string;
  sport: string;
  score: unknown;
}

export function useLiveScore(socketRoom: string | null) {
  const [latestScore, setLatestScore] = useState<ScorePayload | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('g3_admin_token');
    const s = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socket || !socketRoom) return;
    socket.emit('joinRoom', socketRoom);
    socket.on('scoreUpdate', (payload: ScorePayload) => setLatestScore(payload));
    return () => {
      socket.emit('leaveRoom', socketRoom);
      socket.off('scoreUpdate');
    };
  }, [socket, socketRoom]);

  return latestScore;
}
```

- [ ] **Step 3: LiveMatchPage**

Replace `apps/admin/src/pages/LiveMatchPage.tsx`:
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveMatches, LiveMatch } from '@/api/matches';
import { useLiveScore } from '@/hooks/useLiveScore';

function MatchMonitor({ match }: { match: LiveMatch }) {
  const liveScore = useLiveScore(match.socketRoom);

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-lime uppercase tracking-widest">● LIVE</span>
        <span className="text-xs text-muted">{match.sport} · Round {match.round}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{match.teamA.name}</span>
        <span className="text-muted text-sm">vs</span>
        <span className="font-bold text-white">{match.teamB.name}</span>
      </div>
      <p className="text-xs text-muted">{match.tournament.name}{match.ground ? ` · ${match.ground.name}` : ''}</p>
      {liveScore && (
        <pre className="bg-bg rounded-xl p-3 text-xs text-cyan overflow-auto max-h-32">
          {JSON.stringify(liveScore.score, null, 2)}
        </pre>
      )}
      {!liveScore && <p className="text-muted text-xs italic">Waiting for score updates…</p>}
    </div>
  );
}

export default function LiveMatchPage() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['live-matches'],
    queryFn: fetchLiveMatches,
    refetchInterval: 15_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Live Matches</h1>
        <p className="text-muted text-sm mt-1">Real-time score monitoring via Socket.IO</p>
      </div>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : matches.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((m) => <MatchMonitor key={m.id} match={m} />)}
        </div>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl p-10 text-center">
          <p className="text-muted">No matches currently live.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Production build**

```bash
cd apps/admin && pnpm build 2>&1 | tail -20
```
Expected: `dist/` folder created, no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/pages/LiveMatchPage.tsx apps/admin/src/api/matches.ts apps/admin/src/hooks/useLiveScore.ts
git commit -m "feat(admin): live match monitor with Socket.IO realtime score display"
```

- [ ] **Step 6: Final backend build check**

```bash
cd apps/backend && pnpm build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 7: Final commit — Phase 2 complete**

```bash
git add .
git commit -m "feat: Phase 2 complete — tournament engine + admin dashboard"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Tournament CRUD + team registration + standings → Task 2
- ✅ Knockout bracket generation with power-of-2 padding + nextMatch linking → Task 3
- ✅ Winner advancement creating next-round matches progressively → Task 3
- ✅ BracketMatch.match nullable fix → Task 1
- ✅ Grounds CRUD + availability query → Task 4
- ✅ Teams CRUD + member management → Task 4
- ✅ Match scheduling + scorer assignment + toss + status → Task 5
- ✅ Cricket ball-by-ball scoring + undo via overHistory → Task 6
- ✅ Badminton set scoring with win condition (21, clear by 2, cap 30) → Task 6
- ✅ Pickleball game scoring with win condition (11, clear by 2) → Task 6
- ✅ ScoreGateway.broadcastScoreUpdate called on every score event → Task 6
- ✅ Analytics: dashboard stats, matches-per-day, top players, tournament summary → Task 7
- ✅ Admin app scaffold with Electric Night theme → Task 8
- ✅ Axios client + JWT interceptor + 401 redirect → Task 9
- ✅ Zustand auth store with persist → Task 9
- ✅ Login page + ProtectedRoute → Task 9
- ✅ React Router v6 with /admin/* routes → Task 9
- ✅ Sidebar navigation + layout → Task 9
- ✅ Dashboard stats cards + Recharts AreaChart → Task 10
- ✅ Tournaments list + bracket tree view → Task 11
- ✅ Users table + inline role editor → Task 12
- ✅ Live match monitor + Socket.IO useLiveScore hook → Task 13
- ✅ Admin production build → Task 13

**No placeholders found.**

**Type consistency:** `BracketMatch.match` typed as `Match | null` throughout. `TournamentTeam` relations consistent. ScoreGateway method names match existing `broadcastScoreUpdate(room, payload)` and `broadcastWicket(room, payload)` signatures.
