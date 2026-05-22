import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { JoinRequest } from '../../database/entities/join-request.entity';
import { Team } from '../../database/entities/team.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { BracketModule } from '../bracket/bracket.module';
import { FixtureSchedulerService } from './fixture-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, JoinRequest, Team, TournamentTeam]),
    BracketModule,   // exports BracketService
  ],
  providers: [FixtureSchedulerService],
})
export class SchedulerModule {}
