import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../database/entities/team.entity';
import { TeamMember } from '../../database/entities/team-member.entity';
import { TeamMemberRole } from '@g3/types';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember) private memberRepo: Repository<TeamMember>,
  ) {}

  async create(dto: CreateTeamDto, ownerId: string): Promise<Team> {
    const team = this.teamRepo.create({
      ...dto,
      owner: { id: ownerId },
      captain: { id: ownerId },
    });
    const saved = await this.teamRepo.save(team);
    const member = this.memberRepo.create({
      team: { id: saved.id },
      user: { id: ownerId },
      role: TeamMemberRole.CAPTAIN,
    });
    await this.memberRepo.save(member);
    return saved;
  }

  findAll(): Promise<Team[]> {
    return this.teamRepo.find({ relations: ['owner'] });
  }

  async findOne(id: string): Promise<Team> {
    const t = await this.teamRepo.findOne({ where: { id }, relations: ['owner', 'captain'] });
    if (!t) throw new NotFoundException('Team not found');
    return t;
  }

  async findOneWithMembers(id: string): Promise<Team & { members: TeamMember[] }> {
    const t = await this.findOne(id);
    const members = await this.memberRepo.find({
      where: { team: { id } },
      relations: ['user'],
    });
    return { ...t, members };
  }

  async update(id: string, dto: Partial<CreateTeamDto>, userId: string): Promise<Team> {
    const t = await this.findOne(id);
    if (t.owner.id !== userId) throw new ForbiddenException();
    Object.assign(t, dto);
    return this.teamRepo.save(t);
  }

  async addMember(teamId: string, userId: string, role: TeamMemberRole, jerseyNumber?: number): Promise<TeamMember> {
    const member = this.memberRepo.create({
      team: { id: teamId },
      user: { id: userId },
      role,
      jerseyNumber,
    });
    return this.memberRepo.save(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const m = await this.memberRepo.findOne({ where: { team: { id: teamId }, user: { id: userId } } });
    if (!m) throw new NotFoundException('Member not found');
    await this.memberRepo.remove(m);
  }
}
