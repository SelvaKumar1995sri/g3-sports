import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BracketMatch } from '../../database/entities/bracket-match.entity';
import { Match } from '../../database/entities/match.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { Tournament } from '../../database/entities/tournament.entity';
import { MatchStatus, SportType } from '@g3/types';

@Injectable()
export class BracketService {
  constructor(
    @InjectRepository(BracketMatch) private bmRepo: Repository<BracketMatch>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
    @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
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

    // Check registration deadline
    const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.registrationDeadline) {
      const deadlineEnd = new Date(tournament.registrationDeadline);
      deadlineEnd.setUTCHours(23, 59, 59, 999); // treat as end of day UTC
      if (new Date() <= deadlineEnd) {
        throw new BadRequestException(
          'Registration deadline has not passed yet. Cannot generate fixtures before deadline.',
        );
      }
    }

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

    // Build bracket nodes for each round (round 1 = first round, totalRounds = final)
    const bracketMatchesByRound: BracketMatch[][] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const count = Math.pow(2, totalRounds - round); // R1 has size/2 matches, Final has 1
      const roundMatches: BracketMatch[] = [];
      for (let pos = 0; pos < count; pos++) {
        const bm = this.bmRepo.create({
          tournament: { id: tournamentId } as any,
          round: String(round),
          position: pos,
          match: null,
        });
        roundMatches.push(bm);
      }
      bracketMatchesByRound.push(roundMatches); // index 0 = round 1
    }

    // Save all bracket matches to get IDs
    const saved: BracketMatch[][] = [];
    for (const roundMatches of bracketMatchesByRound) {
      const s = await this.bmRepo.save(roundMatches);
      saved.push(s);
    }

    // Link next_match_id: for round r (index ri), position p → round r+1, position floor(p/2)
    for (let ri = 0; ri < saved.length - 1; ri++) {
      for (let p = 0; p < saved[ri].length; p++) {
        saved[ri][p].nextMatch = saved[ri + 1][Math.floor(p / 2)];
      }
      await this.bmRepo.save(saved[ri]);
    }

    // Create actual Match records for R1 (non-bye slots)
    const r1 = saved[0];
    for (let p = 0; p < r1.length; p++) {
      const teamA = slots[p * 2];
      const teamB = slots[p * 2 + 1];
      if (!teamA && !teamB) continue; // both bye — skip
      if (!teamA || !teamB) {
        // one bye: leave match null, winner is auto-advanced
        continue;
      }
      const match = this.matchRepo.create({
        tournament: { id: tournamentId } as any,
        teamA: teamA.team,
        teamB: teamB.team,
        sport,
        status: MatchStatus.SCHEDULED,
        round: '1',
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
      relations: ['match', 'nextMatch', 'nextMatch.match', 'tournament'],
    });
    if (!bm) throw new NotFoundException('BracketMatch not found');
    if (!bm.nextMatch) return bm; // final — nothing to advance to

    const next = bm.nextMatch;
    // Even position → teamA slot, odd position → teamB slot
    const isTeamA = bm.position % 2 === 0;
    const nextRound = String(Number(bm.round) + 1);

    if (!next.match) {
      // Create the match for the next round
      const nextMatch = this.matchRepo.create({
        tournament: { id: bm.tournament.id } as any,
        sport: bm.match?.sport ?? bm.tournament.sport,
        status: MatchStatus.SCHEDULED,
        round: nextRound,
        socketRoom: `match:${bm.tournament.id}:r${nextRound}:p${next.position}`,
        ...(isTeamA
          ? { teamA: { id: winnerTeamId } as any }
          : { teamB: { id: winnerTeamId } as any }),
      });
      const savedMatch = await this.matchRepo.save(nextMatch);
      next.match = savedMatch;
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
