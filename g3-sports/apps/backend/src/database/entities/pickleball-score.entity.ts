import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('pickleball_scores')
export class PickleballScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'game_number' })
  gameNumber: number;

  @Column({ name: 'team_a_points', default: 0 })
  teamAPoints: number;

  @Column({ name: 'team_b_points', default: 0 })
  teamBPoints: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'serving_team_id' })
  servingTeam: Team | null;

  @Column({ name: 'serve_number', default: 1 })
  serveNumber: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'game_winner_id' })
  gameWinner: Team | null;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;
}
