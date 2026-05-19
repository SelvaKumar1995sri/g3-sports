import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { Match } from './match.entity';

@Entity('bracket_matches')
export class BracketMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Index()
  @ManyToOne(() => Match, { nullable: true, eager: false })
  @JoinColumn({ name: 'match_id' })
  match: Match | null;

  @Column()
  round: string;

  @Column()
  position: number;

  @ManyToOne(() => BracketMatch, { nullable: true })
  @JoinColumn({ name: 'next_match_id' })
  nextMatch: BracketMatch | null;
}
