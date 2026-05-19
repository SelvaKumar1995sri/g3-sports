import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { Team } from './team.entity';

@Entity('tournament_teams')
export class TournamentTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Index()
  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'group_name', type: 'varchar', nullable: true })
  groupName: string | null;

  @Column({ type: 'int', nullable: true })
  seed: number | null;

  @Column({ name: 'is_eliminated', default: false })
  isEliminated: boolean;

  @Column({ name: 'elimination_round', type: 'varchar', nullable: true })
  eliminationRound: string | null;
}
