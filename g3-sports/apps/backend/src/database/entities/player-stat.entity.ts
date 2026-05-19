import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('player_stats')
export class PlayerStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'player_id' })
  player: User;

  @Index()
  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Index()
  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ name: 'stats_data', type: 'jsonb', default: {} })
  statsData: Record<string, unknown>;
}
