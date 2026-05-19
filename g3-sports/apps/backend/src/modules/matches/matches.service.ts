import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';
import { Ground } from '../../database/entities/ground.entity';
import { User } from '../../database/entities/user.entity';
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
}
