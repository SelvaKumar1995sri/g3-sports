import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BracketMatch } from '../../database/entities/bracket-match.entity';
import { Match } from '../../database/entities/match.entity';
import { TournamentTeam } from '../../database/entities/tournament-team.entity';
import { BracketController } from './bracket.controller';
import { BracketService } from './bracket.service';

@Module({
  imports: [TypeOrmModule.forFeature([BracketMatch, Match, TournamentTeam])],
  controllers: [BracketController],
  providers: [BracketService],
  exports: [BracketService],
})
export class BracketModule {}
