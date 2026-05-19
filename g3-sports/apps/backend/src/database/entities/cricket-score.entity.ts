import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('cricket_scores')
export class CricketScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Index()
  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ default: 1 })
  innings: number;

  @Column({ default: 0 })
  runs: number;

  @Column({ default: 0 })
  wickets: number;

  // Note: TypeORM returns DECIMAL columns as strings from pg driver — use parseFloat() when doing arithmetic
  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  overs: number;

  @Column({ type: 'jsonb', default: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0 } })
  extras: Record<string, number>;

  @Column({ name: 'over_history', type: 'jsonb', default: [] })
  overHistory: Record<string, unknown>[];
}
