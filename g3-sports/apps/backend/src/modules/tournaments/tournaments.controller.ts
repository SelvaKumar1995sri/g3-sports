import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseEnumPipe } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { TournamentStatus } from '@g3/types';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly svc: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto, @Request() req: { user: { id: string } }) {
    return this.svc.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto, @Request() req: { user: { id: string } }) {
    return this.svc.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.svc.remove(id, req.user.id);
  }

  @Post(':id/register-team/:teamId')
  @UseGuards(JwtAuthGuard)
  registerTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Request() req: { user: { id: string } }) {
    return this.svc.registerTeam(id, teamId, req.user.id);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.getStandings(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(TournamentStatus)) status: TournamentStatus,
    @Request() req: { user: { id: string } },
  ) {
    return this.svc.updateStatus(id, status, req.user.id);
  }

  // ─── Join Requests ────────────────────────────────────────────────────────────

  @Post(':id/join-requests')
  @UseGuards(JwtAuthGuard)
  requestJoin(
    @Param('id') id: string,
    @Body('type') type: 'singles' | 'doubles',
    @Body('partnerPhone') partnerPhone: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.svc.createJoinRequest(id, user.id, type ?? 'singles', partnerPhone);
  }

  @Get(':id/join-requests')
  @UseGuards(JwtAuthGuard)
  getJoinRequests(@Param('id') id: string, @CurrentUser() user: User) {
    return this.svc.getJoinRequests(id, user.id);
  }

  @Get(':id/join-requests/mine')
  @UseGuards(JwtAuthGuard)
  getMyJoinRequest(@Param('id') id: string, @CurrentUser() user: User) {
    return this.svc.getMyJoinRequest(id, user.id);
  }

  @Patch(':id/join-requests/:reqId')
  @UseGuards(JwtAuthGuard)
  reviewJoinRequest(
    @Param('id') id: string,
    @Param('reqId') reqId: string,
    @Body('action') action: 'approve' | 'deny',
    @CurrentUser() user: User,
  ) {
    return this.svc.reviewJoinRequest(id, reqId, action, user.id);
  }

  /** Returns fixture/match info for the current authenticated player in a tournament. */
  @Get(':id/my-match')
  @UseGuards(JwtAuthGuard)
  getMyMatch(@Param('id') id: string, @CurrentUser() user: User) {
    return this.svc.getMyMatch(id, user.id);
  }
}
