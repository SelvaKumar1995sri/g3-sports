import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { Team } from '../../database/entities/team.entity';
import { JoinRequest } from '../../database/entities/join-request.entity';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { TournamentStatus } from '@g3/types';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament) private tournamentRepo: Repository<Tournament>,
    @InjectRepository(TournamentTeam) private ttRepo: Repository<TournamentTeam>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(JoinRequest) private joinRequestRepo: Repository<JoinRequest>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

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

  findAll(): Promise<Tournament[]> {
    return this.tournamentRepo.find({ relations: ['organizer'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tournament> {
    const t = await this.tournamentRepo.findOne({ where: { id }, relations: ['organizer'] });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async update(id: string, dto: UpdateTournamentDto, userId: string): Promise<Tournament> {
    const t = await this.findOne(id);
    if (t.organizer.id !== userId) throw new ForbiddenException();
    const { startDate, endDate, registrationDeadline, ...rest } = dto;
    Object.assign(t, rest);
    if (startDate) t.startDate = new Date(startDate);
    if (endDate) t.endDate = new Date(endDate);
    if (registrationDeadline !== undefined)
      t.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    return this.tournamentRepo.save(t);
  }

  async remove(id: string, userId: string): Promise<void> {
    const t = await this.findOne(id);
    if (t.organizer.id !== userId) throw new ForbiddenException();
    await this.tournamentRepo.remove(t);
  }

  async registerTeam(tournamentId: string, teamId: string, userId: string): Promise<TournamentTeam> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.status !== TournamentStatus.DRAFT && tournament.status !== TournamentStatus.REGISTRATION) {
      throw new BadRequestException('Registration is closed');
    }
    const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: ['owner'] });
    if (!team) throw new NotFoundException('Team not found');
    // Only tournament organizer or team owner can register
    if (tournament.organizer.id !== userId && team.owner.id !== userId) {
      throw new ForbiddenException('Only the tournament organizer or team owner can register a team');
    }
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

  // ─── Join Requests ────────────────────────────────────────────────────────────

  async createJoinRequest(
    tournamentId: string,
    playerId: string,
    type: 'singles' | 'doubles',
    partnerPhone?: string,
  ): Promise<JoinRequest> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.organizer?.id === playerId) {
      throw new BadRequestException('Organizer cannot join their own tournament');
    }

    // Check if player already made a direct request
    const existing = await this.joinRequestRepo.findOne({
      where: { tournament: { id: tournamentId }, player: { id: playerId } },
    });
    if (existing) throw new ConflictException('You have already requested to join this tournament');

    // Check if player is already listed as a doubles partner in another request
    const player = await this.userRepo.findOne({ where: { id: playerId } });
    if (player?.phone) {
      const asPartner = await this.joinRequestRepo.findOne({
        where: { tournament: { id: tournamentId }, partnerPhone: player.phone },
      });
      if (asPartner) {
        throw new ConflictException(
          'You are already included as a doubles partner in another request for this tournament',
        );
      }
    }

    const req = this.joinRequestRepo.create({
      tournament: { id: tournamentId },
      player: { id: playerId },
      type,
      partnerPhone: type === 'doubles' ? (partnerPhone ?? null) : null,
      status: 'pending',
    });
    return this.joinRequestRepo.save(req);
  }

  async getJoinRequests(tournamentId: string, requestingUserId: string): Promise<JoinRequest[]> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.organizer?.id !== requestingUserId) throw new ForbiddenException();
    return this.joinRequestRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyJoinRequest(tournamentId: string, playerId: string): Promise<(JoinRequest & { isPartner?: boolean }) | null> {
    // First: check if this player made a direct request
    const direct = await this.joinRequestRepo.findOne({
      where: { tournament: { id: tournamentId }, player: { id: playerId } },
      relations: ['player'],
    });
    if (direct) return direct;

    // Second: check if this player is listed as the doubles partner in someone else's request
    const player = await this.userRepo.findOne({ where: { id: playerId } });
    if (!player?.phone) return null;

    const asPartner = await this.joinRequestRepo.findOne({
      where: { tournament: { id: tournamentId }, partnerPhone: player.phone },
      relations: ['player'],
    });
    if (!asPartner) return null;

    // Return the request with a flag indicating they are the partner (not the requester)
    return Object.assign(asPartner, { isPartner: true });
  }

  async getMyMatch(
    tournamentId: string,
    playerId: string,
  ): Promise<{ hasFixtures: boolean; scheduledAt: string | null; round: string | null; opponentName: string | null }> {
    // Check if the tournament has any matches at all (fixtures generated)
    const matchCount = await this.matchRepo.count({
      where: { tournament: { id: tournamentId } },
    });

    if (matchCount === 0) {
      return { hasFixtures: false, scheduledAt: null, round: null, opponentName: null };
    }

    // Try to find a match where the approved player's team is involved.
    // Since join requests don't automatically create teams, we look for a match
    // whose teamA or teamB is owned by this player.
    const myMatches = await this.matchRepo.find({
      where: [
        { tournament: { id: tournamentId }, teamA: { owner: { id: playerId } } },
        { tournament: { id: tournamentId }, teamB: { owner: { id: playerId } } },
      ],
      relations: ['teamA', 'teamA.owner', 'teamB', 'teamB.owner'],
      order: { scheduledAt: 'ASC' },
    });

    if (myMatches.length === 0) {
      // Fixtures exist but no specific match found for this player yet
      return { hasFixtures: true, scheduledAt: null, round: null, opponentName: null };
    }

    const match = myMatches[0];
    const isTeamA = match.teamA.owner?.id === playerId;
    const opponent = isTeamA ? match.teamB : match.teamA;
    const opponentName = opponent.name ?? opponent.owner?.fullName ?? null;

    return {
      hasFixtures: true,
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      round: match.round,
      opponentName,
    };
  }

  async reviewJoinRequest(
    tournamentId: string,
    requestId: string,
    action: 'approve' | 'deny',
    organizerId: string,
  ): Promise<JoinRequest> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.organizer?.id !== organizerId) throw new ForbiddenException();
    const req = await this.joinRequestRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Join request not found');
    req.status = action === 'approve' ? 'approved' : 'denied';
    return this.joinRequestRepo.save(req);
  }
}
