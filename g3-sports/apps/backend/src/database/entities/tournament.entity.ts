import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { SportType, TournamentFormat, TournamentStatus } from '@g3/types';
import { User } from './user.entity';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: TournamentFormat })
  format: TournamentFormat;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.DRAFT })
  status: TournamentStatus;

  @Column({ name: 'banner_url', type: 'varchar', nullable: true })
  bannerUrl: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'registration_deadline', type: 'date', nullable: true })
  registrationDeadline: Date | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ name: 'rules_config', type: 'jsonb', default: {} })
  rulesConfig: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
