import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../../database/entities/tournament.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { Team } from '../../database/entities/team.entity';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, TournamentTeam, Team])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
