import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CricketScore } from '../../database/entities/cricket-score.entity';
import { BadmintonScore } from '../../database/entities/badminton-score.entity';
import { PickleballScore } from '../../database/entities/pickleball-score.entity';
import { Match } from '../../database/entities/match.entity';
import { ScoreGateway } from '../gateway/score.gateway';
import { MatchStatus, SportType, WicketType } from '@g3/types';
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

  // ─── Cricket ─────────────────────────────────────────────────────────────────

  private async getOrCreateCricketInnings(
    matchId: string,
    teamId: string,
    innings: number,
  ): Promise<CricketScore> {
    let score = await this.cricketRepo.findOne({
      where: { match: { id: matchId }, team: { id: teamId }, innings },
    });
    if (!score) {
      score = this.cricketRepo.create({
        match: { id: matchId } as Match,
        team: { id: teamId } as any,
        innings,
        runs: 0,
        wickets: 0,
        overs: 0,
        extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0 },
        overHistory: [],
      });
      score = await this.cricketRepo.save(score);
    }
    return score;
  }

  async recordCricketBall(dto: CricketBallDto): Promise<CricketScore> {
    const match = await this.matchRepo.findOne({
      where: { id: dto.matchId },
      relations: ['teamA', 'teamB'],
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.LIVE) throw new BadRequestException('Match is not live');

    const innings = dto.innings ?? 1;
    const score = await this.getOrCreateCricketInnings(dto.matchId, dto.battingTeamId, innings);

    const ballRuns = dto.runs + (dto.extras ?? 0);
    score.runs += ballRuns;

    const ex = score.extras as Record<string, number>;
    if (dto.isWide) {
      ex.wides = (ex.wides ?? 0) + (dto.extras ?? 1);
    } else if (dto.isNoBall) {
      ex.no_balls = (ex.no_balls ?? 0) + (dto.extras ?? 1);
    }

    if (dto.isWicket && !dto.isWide && !dto.isNoBall) {
      score.wickets += 1;
    }

    // Legal delivery: advance overs counter
    // overs is a DECIMAL — pg driver returns it as a string, use parseFloat
    if (!dto.isWide && !dto.isNoBall) {
      const currentBalls = Math.round(parseFloat(String(score.overs)) * 6 + 1);
      score.overs = parseFloat((currentBalls / 6).toFixed(1));
    }

    // Append to overHistory for undo support
    const history = Array.isArray(score.overHistory) ? [...score.overHistory] : [];
    history.push({
      runs: dto.runs,
      extras: dto.extras ?? 0,
      isWicket: dto.isWicket ?? false,
      wicketType: dto.wicketType ?? null,
      isWide: dto.isWide ?? false,
      isNoBall: dto.isNoBall ?? false,
    });
    score.overHistory = history;

    const saved = await this.cricketRepo.save(score);

    if (match.socketRoom) {
      const battingTeam = match.teamA.id === dto.battingTeamId ? match.teamA : match.teamB;
      const bowlingTeam = match.teamA.id === dto.battingTeamId ? match.teamB : match.teamA;
      const allInnings = await this.cricketRepo.find({ where: { match: { id: dto.matchId } } });

      const teamAInnings = allInnings.filter(s => s.team?.id === match.teamA.id || s.team === (match.teamA as any));
      const teamBInnings = allInnings.filter(s => s.team?.id === match.teamB.id || s.team === (match.teamB as any));

      await this.gateway.broadcastScoreUpdate(match.socketRoom, {
        match_id: dto.matchId,
        sport: SportType.CRICKET,
        team_a_score: { innings: teamAInnings } as Record<string, unknown>,
        team_b_score: { innings: teamBInnings } as Record<string, unknown>,
        status: match.status,
        updated_at: new Date().toISOString(),
      });

      if (dto.isWicket && dto.wicketType) {
        await this.gateway.broadcastWicket(match.socketRoom, {
          match_id: dto.matchId,
          sport: SportType.CRICKET,
          player_id: battingTeam.id,
          player_name: battingTeam.name ?? '',
          wicket_type: dto.wicketType,
          over: parseFloat(String(saved.overs)),
          ball: Math.round(parseFloat(String(saved.overs)) * 6) % 6,
        });
      }
    }

    return saved;
  }

  async undoCricketBall(matchId: string, teamId: string, innings: number): Promise<CricketScore> {
    const score = await this.cricketRepo.findOne({
      where: { match: { id: matchId }, team: { id: teamId }, innings },
    });
    if (!score) throw new NotFoundException('Score not found');
    const history = Array.isArray(score.overHistory) ? [...score.overHistory] : [];
    if (!history.length) throw new BadRequestException('Nothing to undo');

    const last = history.pop() as Record<string, unknown>;
    score.overHistory = history;
    score.runs -= ((last.runs as number) + (last.extras as number ?? 0));

    if (last.isWicket && !last.isWide && !last.isNoBall) {
      score.wickets = Math.max(0, score.wickets - 1);
    }
    if (!last.isWide && !last.isNoBall) {
      const currentBalls = Math.round(parseFloat(String(score.overs)) * 6) - 1;
      score.overs = parseFloat((Math.max(0, currentBalls) / 6).toFixed(1));
    }

    const saved = await this.cricketRepo.save(score);
    const match = await this.matchRepo.findOne({ where: { id: matchId }, relations: ['teamA', 'teamB'] });
    if (match?.socketRoom) {
      const allInnings = await this.cricketRepo.find({ where: { match: { id: matchId } } });
      const teamAInnings = allInnings.filter(s => s.team?.id === match.teamA.id || s.team === (match.teamA as any));
      const teamBInnings = allInnings.filter(s => s.team?.id === match.teamB.id || s.team === (match.teamB as any));

      await this.gateway.broadcastScoreUpdate(match.socketRoom, {
        match_id: matchId,
        sport: SportType.CRICKET,
        team_a_score: { innings: teamAInnings } as Record<string, unknown>,
        team_b_score: { innings: teamBInnings } as Record<string, unknown>,
        status: match.status,
        updated_at: new Date().toISOString(),
      });
    }
    return saved;
  }

  // ─── Badminton ───────────────────────────────────────────────────────────────

  private async getOrCreateBadmintonSet(matchId: string, setNumber: number): Promise<BadmintonScore> {
    let score = await this.badmintonRepo.findOne({
      where: { match: { id: matchId }, setNumber },
    });
    if (!score) {
      score = this.badmintonRepo.create({
        match: { id: matchId } as Match,
        setNumber,
        teamAPoints: 0,
        teamBPoints: 0,
        isCompleted: false,
      });
      score = await this.badmintonRepo.save(score);
    }
    return score;
  }

  async recordBadmintonPoint(dto: BadmintonPointDto): Promise<BadmintonScore> {
    const match = await this.matchRepo.findOne({
      where: { id: dto.matchId },
      relations: ['teamA', 'teamB'],
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.LIVE) throw new BadRequestException('Match is not live');

    const set = await this.getOrCreateBadmintonSet(dto.matchId, dto.setNumber);
    if (set.isCompleted) throw new BadRequestException('Set already completed');

    if (dto.scoringTeam === 'A') set.teamAPoints += 1;
    else set.teamBPoints += 1;

    // Win condition: 21 points with 2-point lead, cap at 30
    const a = set.teamAPoints;
    const b = set.teamBPoints;
    if ((a >= 21 && a - b >= 2) || a >= 30) {
      set.isCompleted = true;
      set.setWinner = match.teamA;
    } else if ((b >= 21 && b - a >= 2) || b >= 30) {
      set.isCompleted = true;
      set.setWinner = match.teamB;
    }

    const saved = await this.badmintonRepo.save(set);

    if (match.socketRoom) {
      const allSets = await this.badmintonRepo.find({
        where: { match: { id: dto.matchId } },
        order: { setNumber: 'ASC' },
      });
      await this.gateway.broadcastScoreUpdate(match.socketRoom, {
        match_id: dto.matchId,
        sport: SportType.BADMINTON,
        team_a_score: { sets: allSets.map(s => s.teamAPoints) } as Record<string, unknown>,
        team_b_score: { sets: allSets.map(s => s.teamBPoints) } as Record<string, unknown>,
        status: match.status,
        updated_at: new Date().toISOString(),
      });
    }

    return saved;
  }

  // ─── Pickleball ──────────────────────────────────────────────────────────────

  private async getOrCreatePickleballGame(matchId: string, gameNumber: number): Promise<PickleballScore> {
    let score = await this.pickleballRepo.findOne({
      where: { match: { id: matchId }, gameNumber },
    });
    if (!score) {
      score = this.pickleballRepo.create({
        match: { id: matchId } as Match,
        gameNumber,
        teamAPoints: 0,
        teamBPoints: 0,
        isCompleted: false,
      });
      score = await this.pickleballRepo.save(score);
    }
    return score;
  }

  async recordPickleballPoint(dto: PickleballPointDto): Promise<PickleballScore> {
    const match = await this.matchRepo.findOne({
      where: { id: dto.matchId },
      relations: ['teamA', 'teamB'],
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.LIVE) throw new BadRequestException('Match is not live');

    const game = await this.getOrCreatePickleballGame(dto.matchId, dto.gameNumber);
    if (game.isCompleted) throw new BadRequestException('Game already completed');

    if (dto.scoringTeam === 'A') game.teamAPoints += 1;
    else game.teamBPoints += 1;

    // Win condition: 11 points with 2-point lead
    const a = game.teamAPoints;
    const b = game.teamBPoints;
    if (a >= 11 && a - b >= 2) {
      game.isCompleted = true;
      game.gameWinner = match.teamA;
    } else if (b >= 11 && b - a >= 2) {
      game.isCompleted = true;
      game.gameWinner = match.teamB;
    }

    const saved = await this.pickleballRepo.save(game);

    if (match.socketRoom) {
      const allGames = await this.pickleballRepo.find({
        where: { match: { id: dto.matchId } },
        order: { gameNumber: 'ASC' },
      });
      await this.gateway.broadcastScoreUpdate(match.socketRoom, {
        match_id: dto.matchId,
        sport: SportType.PICKLEBALL,
        team_a_score: { games: allGames.map(g => g.teamAPoints) } as Record<string, unknown>,
        team_b_score: { games: allGames.map(g => g.teamBPoints) } as Record<string, unknown>,
        status: match.status,
        updated_at: new Date().toISOString(),
      });
    }

    return saved;
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  getCricketScore(matchId: string): Promise<CricketScore[]> {
    return this.cricketRepo.find({ where: { match: { id: matchId } } });
  }

  getBadmintonScore(matchId: string): Promise<BadmintonScore[]> {
    return this.badmintonRepo.find({
      where: { match: { id: matchId } },
      order: { setNumber: 'ASC' },
    });
  }

  getPickleballScore(matchId: string): Promise<PickleballScore[]> {
    return this.pickleballRepo.find({
      where: { match: { id: matchId } },
      order: { gameNumber: 'ASC' },
    });
  }
}
