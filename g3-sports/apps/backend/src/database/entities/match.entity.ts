import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { SportType, MatchStatus } from '@g3/types';
import { Tournament } from './tournament.entity';
import { Ground } from './ground.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => Ground, { nullable: true })
  @JoinColumn({ name: 'ground_id' })
  ground: Ground | null;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_a_id' })
  teamA: Team;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_b_id' })
  teamB: Team;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scorer_id' })
  scorer: User | null;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ type: 'varchar', nullable: true })
  round: string | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'winner_id' })
  winner: Team | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'socket_room', type: 'varchar', nullable: true })
  socketRoom: string | null;
}
