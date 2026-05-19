import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BracketService } from './bracket.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SportType } from '@g3/types';

@Controller('brackets')
export class BracketController {
  constructor(private readonly svc: BracketService) {}

  @Post(':tournamentId/generate')
  @UseGuards(JwtAuthGuard)
  generate(@Param('tournamentId') id: string, @Body('sport') sport: SportType) {
    return this.svc.generate(id, sport);
  }

  @Get(':tournamentId')
  getBracket(@Param('tournamentId') id: string) {
    return this.svc.getBracket(id);
  }

  @Patch(':bracketMatchId/advance')
  @UseGuards(JwtAuthGuard)
  advance(@Param('bracketMatchId') id: string, @Body('winnerTeamId') winnerTeamId: string) {
    return this.svc.advanceWinner(id, winnerTeamId);
  }
}
