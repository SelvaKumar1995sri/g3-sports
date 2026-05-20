import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Tournament } from './entities/tournament.entity';
import { Ground } from './entities/ground.entity';
import { TournamentTeam } from './entities/tournament-team.entity';
import { Match } from './entities/match.entity';
import { CricketScore } from './entities/cricket-score.entity';
import { BadmintonScore } from './entities/badminton-score.entity';
import { PickleballScore } from './entities/pickleball-score.entity';
import { PlayerStat } from './entities/player-stat.entity';
import { Notification } from './entities/notification.entity';
import { BracketMatch } from './entities/bracket-match.entity';
import { RoleRequest } from './entities/role-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        ssl: cfg.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [
          User, UserProfile, Team, TeamMember, Tournament, Ground,
          TournamentTeam, Match, CricketScore, BadmintonScore,
          PickleballScore, PlayerStat, Notification, BracketMatch, RoleRequest,
        ],
        synchronize: cfg.get('DB_SYNC') === 'true' || cfg.get('NODE_ENV') !== 'production',
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
