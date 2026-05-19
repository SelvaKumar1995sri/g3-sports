import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ground } from '../../database/entities/ground.entity';
import { SportType } from '@g3/types';
import { CreateGroundDto } from './dto/create-ground.dto';

@Injectable()
export class GroundsService {
  constructor(@InjectRepository(Ground) private repo: Repository<Ground>) {}

  create(dto: CreateGroundDto, ownerId: string): Promise<Ground> {
    const ground = this.repo.create({
      name: dto.name,
      sportType: dto.sportType,
      isAvailable: dto.isAvailable,
      capacity: dto.capacity,
      owner: { id: ownerId },
      tournament: dto.tournamentId ? { id: dto.tournamentId } : null,
    });
    return this.repo.save(ground);
  }

  findAll(): Promise<Ground[]> {
    return this.repo.find({ relations: ['owner', 'tournament'] });
  }

  async findOne(id: string): Promise<Ground> {
    const g = await this.repo.findOne({ where: { id }, relations: ['owner', 'tournament'] });
    if (!g) throw new NotFoundException('Ground not found');
    return g;
  }

  async update(id: string, dto: Partial<CreateGroundDto>): Promise<Ground> {
    const g = await this.findOne(id);
    if (dto.name !== undefined) g.name = dto.name;
    if (dto.sportType !== undefined) g.sportType = dto.sportType;
    if (dto.isAvailable !== undefined) g.isAvailable = dto.isAvailable;
    if (dto.capacity !== undefined) g.capacity = dto.capacity;
    if (dto.tournamentId !== undefined) {
      g.tournament = dto.tournamentId ? ({ id: dto.tournamentId } as any) : null;
    }
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
