import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Index()
  @Column()
  name: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl: string | null;

  @Column({ name: 'theme_color', nullable: true })
  themeColor: string | null;

  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'captain_id' })
  captain: User | null;

  @Column({ nullable: true })
  nickname: string | null;

  @Column({ nullable: true })
  description: string | null;

  @Column({ name: 'sponsor_info', type: 'jsonb', nullable: true })
  sponsorInfo: Record<string, unknown> | null;
}
