import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, ParseEnumPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { TossDto } from './dto/toss.dto';
import { StartMatchDto } from './dto/start-match.dto';
import { CompleteMatchDto } from './dto/complete-match.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MatchStatus } from '@g3/types';
import { User } from '../../database/entities/user.entity';

@Controller('matches')
export class MatchesController {
  constructor(private readonly svc: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateMatchDto) { return this.svc.create(dto); }

  @Get()
  findAll(@Query('tournamentId') tournamentId?: string) { return this.svc.findAll(tournamentId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id/scorer')
  @UseGuards(JwtAuthGuard)
  assignScorer(@Param('id') id: string, @Body('scorerId') scorerId: string) {
    return this.svc.assignScorer(id, scorerId);
  }

  @Patch(':id/toss')
  @UseGuards(JwtAuthGuard)
  toss(@Param('id') id: string, @Body() dto: TossDto) {
    return this.svc.recordToss(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  status(@Param('id') id: string, @Body('status', new ParseEnumPipe(MatchStatus)) status: MatchStatus) {
    return this.svc.updateStatus(id, status);
  }

  @Patch(':id/ground')
  @UseGuards(JwtAuthGuard)
  ground(@Param('id') id: string, @Body('groundId') groundId: string) {
    return this.svc.assignGround(id, groundId);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard)
  startMatch(
    @Param('id') id: string,
    @Body() dto: StartMatchDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.startMatch(id, user.id, dto);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  completeMatch(
    @Param('id') id: string,
    @Body() dto: CompleteMatchDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.completeMatch(id, user.id, dto.winnerTeamId);
  }
}
