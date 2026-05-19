import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';   // created in Task 4
import { AuthModule } from './modules/auth/auth.module';       // created in Task 6
import { UsersModule } from './modules/users/users.module';    // created in Task 7
import { UploadModule } from './modules/upload/upload.module'; // created in Task 9
import { GatewayModule } from './modules/gateway/gateway.module'; // created in Task 8
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { BracketModule } from './modules/bracket/bracket.module';
import { GroundsModule } from './modules/grounds/grounds.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ScoreModule } from './modules/score/score.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
