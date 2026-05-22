import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { JoinRequest } from '../../database/entities/join-request.entity';
import { Team } from '../../database/entities/team.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { TournamentStatus } from '@g3/types';
import { BracketService } from '../bracket/bracket.service';

@Injectable()
export class FixtureSchedulerService {
  private readonly logger = new Logger(FixtureSchedulerService.name);

  constructor(
    @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
    @InjectRepository(JoinRequest) private joinRequestRepo: Repository<JoinRequest>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
    private readonly bracketService: BracketService,
  ) {}

  /**
   * Runs every minute. Finds all tournaments whose registration deadline has
   * fully passed (i.e. before TODAY) and whose status is still DRAFT or
   * REGISTRATION — meaning fixtures haven't been generated yet.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processExpiredRegistrations(): Promise<void> {
    // Use start-of-today so a deadline of "today" is NOT yet processed;
    // only deadlines that were yesterday or earlier trigger the job.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const tournaments = await this.tournamentRepo.find({
      where: [
        { status: TournamentStatus.DRAFT, registrationDeadline: LessThan(startOfToday) as any },
        { status: TournamentStatus.REGISTRATION, registrationDeadline: LessThan(startOfToday) as any },
      ],
    });

    for (const tournament of tournaments) {
      try {
        await this.processTournament(tournament);
      } catch (err) {
        this.logger.error(
          `Unhandled error processing tournament ${tournament.id}: ${err}`,
        );
      }
    }
  }

  private async processTournament(tournament: Tournament): Promise<void> {
    this.logger.log(
      `Registration deadline passed for "${tournament.name}" (${tournament.id}). Processing…`,
    );

    // Count approved join requests
    const approved = await this.joinRequestRepo.find({
      where: { tournament: { id: tournament.id }, status: 'approved' },
      relations: ['player'],
    });

    // ── Not enough participants ──────────────────────────────────────────────
    if (approved.length < 2) {
      const reason =
        approved.length === 0
          ? 'No participants registered before the registration deadline.'
          : `Only ${approved.length} participant approved. A minimum of 2 is required to generate fixtures.`;

      this.logger.warn(`Cancelling "${tournament.name}": ${reason}`);

      tournament.status = TournamentStatus.CANCELLED;
      tournament.rulesConfig = {
        ...tournament.rulesConfig,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      };
      await this.tournamentRepo.save(tournament);
      return;
    }

    // ── Enough participants — create teams and generate bracket ──────────────
    this.logger.log(
      `"${tournament.name}" has ${approved.length} approved participants. Creating teams…`,
    );

    for (let i = 0; i < approved.length; i++) {
      const req = approved[i];
      const playerLabel =
        req.player.fullName ?? req.player.username ?? `Player ${i + 1}`;
      const teamName =
        req.type === 'doubles' && req.partnerPhone
          ? `${playerLabel} & Partner`
          : playerLabel;

      // Create an auto-generated team owned by the approved player
      const team = this.teamRepo.create({
        owner: { id: req.player.id } as any,
        name: teamName,
        sport: tournament.sport,
        captain: { id: req.player.id } as any,
      });
      const savedTeam = await this.teamRepo.save(team);

      // Register the team in the tournament (seeded in approval order)
      const tt = this.ttRepo.create({
        tournament: { id: tournament.id } as any,
        team: savedTeam,
        seed: i + 1,
      });
      await this.ttRepo.save(tt);
    }

    // Generate the bracket (BracketService handles the match-creation logic)
    try {
      await this.bracketService.generate(tournament.id, tournament.sport, true);
      tournament.status = TournamentStatus.ACTIVE;
      await this.tournamentRepo.save(tournament);
      this.logger.log(
        `✓ Fixtures generated for "${tournament.name}" with ${approved.length} teams. Status → ACTIVE.`,
      );
    } catch (err) {
      this.logger.error(
        `Bracket generation failed for "${tournament.name}" (${tournament.id}): ${err}`,
      );
      // Don't re-try automatically — the teams are already created so a manual
      // re-trigger via the bracket endpoint will work.
    }
  }
}
