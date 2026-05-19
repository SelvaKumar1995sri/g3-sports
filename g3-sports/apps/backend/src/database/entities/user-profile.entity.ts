import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import { SportType } from '@g3/types';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  bio: string | null;

  @Column({ nullable: true })
  city: string | null;

  @Column({ name: 'preferred_sport', type: 'enum', enum: SportType, nullable: true })
  preferredSport: SportType | null;

  @Column({ name: 'jersey_number', nullable: true })
  jerseyNumber: number | null;

  @Column({ name: 'batting_style', nullable: true })
  battingStyle: string | null;

  @Column({ name: 'device_tokens', type: 'text', array: true, default: [] })
  deviceTokens: string[];
}
