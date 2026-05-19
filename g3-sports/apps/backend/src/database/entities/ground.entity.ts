import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';
import { Tournament } from './tournament.entity';

@Entity('grounds')
export class Ground {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament | null;

  @Column()
  name: string;

  @Column({ name: 'sport_type', type: 'enum', enum: SportType })
  sportType: SportType;

  @Column({ nullable: true })
  capacity: number | null;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
