import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { Team } from '../../database/entities/team.entity';
import { PlayerStat } from '../../database/entities/player-stat.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Match, User, Team, PlayerStat])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
