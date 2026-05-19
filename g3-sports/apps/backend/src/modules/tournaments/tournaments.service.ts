import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { Team } from '../../database/entities/team.entity';
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
    const t = await this.tournamentRepo.findOne({ where: { id }, relations: ['organizer'] });
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
