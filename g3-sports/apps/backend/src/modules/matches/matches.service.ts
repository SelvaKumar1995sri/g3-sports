import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';
import { Ground } from '../../database/entities/ground.entity';
import { User } from '../../database/entities/user.entity';
import { MatchStatus } from '@g3/types';
import { CreateMatchDto } from './dto/create-match.dto';
import { TossDto } from './dto/toss.dto';
import { BracketMatch } from '../../database/entities/bracket-match.entity';
import { StartMatchDto } from './dto/start-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Ground) private groundRepo: Repository<Ground>,
    @InjectRepository(BracketMatch) private bracketMatchRepo: Repository<BracketMatch>,
  ) {}

  async create(dto: CreateMatchDto): Promise<Match> {
    const match = this.matchRepo.create({
      tournament: { id: dto.tournamentId },
      teamA: { id: dto.teamAId },
      teamB: { id: dto.teamBId },
      sport: dto.sport,
      status: MatchStatus.SCHEDULED,
      round: String(dto.round ?? 1),
      socketRoom: `match:${dto.tournamentId}:${Date.now()}`,
      ...(dto.groundId && { ground: { id: dto.groundId } }),
      ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
    });
    return this.matchRepo.save(match);
  }

  findAll(tournamentId?: string): Promise<Match[]> {
    const where = tournamentId ? { tournament: { id: tournamentId } } : {};
    return this.matchRepo.find({
      where,
      relations: ['teamA', 'teamB', 'ground', 'tournament'],
    });
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
    m.scorer = { id: scorerId } as User;
    return this.matchRepo.save(m);
  }

  async recordToss(matchId: string, dto: TossDto): Promise<Match> {
    const m = await this.findOne(matchId);
    if (m.status !== MatchStatus.SCHEDULED) throw new BadRequestException('Toss only before match starts');
    // Note: Match entity has no toss columns; toss outcome is not persisted
    // To persist toss data, add tossWinnerId (FK) and tossDecision columns to the entity
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
}
