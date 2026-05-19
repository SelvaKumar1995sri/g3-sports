import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity('badminton_scores')
export class BadmintonScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'set_number' })
  setNumber: number;

  @Column({ name: 'team_a_points', default: 0 })
  teamAPoints: number;

  @Column({ name: 'team_b_points', default: 0 })
  teamBPoints: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'server_id' })
  server: User | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'set_winner_id' })
  setWinner: Team | null;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;
}
