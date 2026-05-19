import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { Team } from '../../database/entities/team.entity';
import { PlayerStat } from '../../database/entities/player-stat.entity';
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
      this.tournamentRepo.count({ where: { status: TournamentStatus.ACTIVE } }),
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
    // Match entity has scheduled_at; fall back to all matches grouped by scheduled date
    const rows = await this.matchRepo
      .createQueryBuilder('m')
      .select("DATE(m.scheduled_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('m.scheduled_at >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();
    return rows.map(r => ({ date: r.date, count: Number(r.count) }));
  }

  async getTopPlayers(limit = 10): Promise<PlayerStat[]> {
    // PlayerStat stores numeric stats in statsData (jsonb); return most recent records as proxy
    return this.statRepo.find({
      relations: ['player', 'match', 'team'],
      take: limit,
    });
  }

  async getTournamentSummary(tournamentId: string): Promise<{ total: number; completed: number; live: number; pending: number }> {
    const [total, completed, live] = await Promise.all([
      this.matchRepo.count({ where: { tournament: { id: tournamentId } } }),
      this.matchRepo.count({ where: { tournament: { id: tournamentId }, status: MatchStatus.COMPLETED } }),
      this.matchRepo.count({ where: { tournament: { id: tournamentId }, status: MatchStatus.LIVE } }),
    ]);
    return { total, completed, live, pending: total - completed - live };
  }
}
