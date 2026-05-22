import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { BracketModule } from './modules/bracket/bracket.module';
import { GroundsModule } from './modules/grounds/grounds.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ScoreModule } from './modules/score/score.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UploadModule,
    GatewayModule,
    TournamentsModule,
    BracketModule,
    GroundsModule,
    TeamsModule,
    MatchesModule,
    ScoreModule,
    AnalyticsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
