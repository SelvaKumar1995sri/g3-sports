import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  Index, OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '@g3/types';
import { UserProfile } from './user-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  phone: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: true })
  username: string | null;

  @Column({ name: 'full_name', nullable: true })
  fullName: string | null;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Exclude()
  @Column({ name: 'firebase_uid', unique: true, nullable: true })
  firebaseUid: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => UserProfile, (p) => p.user, { cascade: true })
  profile: UserProfile;
}
