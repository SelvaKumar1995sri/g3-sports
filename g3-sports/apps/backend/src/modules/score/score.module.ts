import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketScore } from '../../database/entities/cricket-score.entity';
import { BadmintonScore } from '../../database/entities/badminton-score.entity';
import { PickleballScore } from '../../database/entities/pickleball-score.entity';
import { Match } from '../../database/entities/match.entity';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([CricketScore, BadmintonScore, PickleballScore, Match]), GatewayModule],
  controllers: [ScoreController],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
