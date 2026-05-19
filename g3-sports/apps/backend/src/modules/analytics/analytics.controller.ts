import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard')
  dashboard() { return this.svc.getDashboardStats(); }

  @Get('matches-per-day')
  matchesPerDay(@Query('days') days?: string) {
    return this.svc.getMatchesPerDay(days ? Number(days) : 30);
  }

  @Get('top-players')
  topPlayers(@Query('limit') limit?: string) {
    return this.svc.getTopPlayers(limit ? Number(limit) : 10);
  }

  @Get('tournament/:id/summary')
  tournamentSummary(@Param('id') id: string) {
    return this.svc.getTournamentSummary(id);
  }
}
