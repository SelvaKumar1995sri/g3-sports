import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScoreService } from './score.service';
import { CricketBallDto } from './dto/cricket-ball.dto';
import { BadmintonPointDto } from './dto/badminton-point.dto';
import { PickleballPointDto } from './dto/pickleball-point.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('score')
@UseGuards(JwtAuthGuard)
export class ScoreController {
  constructor(private readonly svc: ScoreService) {}

  // ─── Cricket ─────────────────────────────────────────────────────────────────

  @Get('cricket/:matchId')
  getCricket(@Param('matchId') id: string) {
    return this.svc.getCricketScore(id);
  }

  @Post('cricket/ball')
  recordBall(@Body() dto: CricketBallDto) {
    return this.svc.recordCricketBall(dto);
  }

  @Delete('cricket/:matchId/undo')
  undoCricket(
    @Param('matchId') matchId: string,
    @Body() body: { teamId: string; innings?: number },
  ) {
    return this.svc.undoCricketBall(matchId, body.teamId, body.innings ?? 1);
  }

  // ─── Badminton ───────────────────────────────────────────────────────────────

  @Get('badminton/:matchId')
  getBadminton(@Param('matchId') id: string) {
    return this.svc.getBadmintonScore(id);
  }

  @Post('badminton/point')
  recordBadmintonPoint(@Body() dto: BadmintonPointDto) {
    return this.svc.recordBadmintonPoint(dto);
  }

  // ─── Pickleball ──────────────────────────────────────────────────────────────

  @Get('pickleball/:matchId')
  getPickleball(@Param('matchId') id: string) {
    return this.svc.getPickleballScore(id);
  }

  @Post('pickleball/point')
  recordPickleballPoint(@Body() dto: PickleballPointDto) {
    return this.svc.recordPickleballPoint(dto);
  }
}
