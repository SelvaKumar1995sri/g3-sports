import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from './user.entity';

export type JoinRequestStatus = 'pending' | 'approved' | 'denied';
export type JoinType = 'singles' | 'doubles';

@Entity('join_requests')
export class JoinRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'player_id' })
  player: User;

  @Column({ type: 'varchar', default: 'singles' })
  type: JoinType;

  @Column({ name: 'partner_phone', type: 'varchar', nullable: true })
  partnerPhone: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: JoinRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
