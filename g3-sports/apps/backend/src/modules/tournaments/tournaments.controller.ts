import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TournamentStatus } from '@g3/types';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly svc: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto, @Request() req: { user: { sub: string } }) {
    return this.svc.create(dto, req.user.sub);
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
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto, @Request() req: { user: { sub: string } }) {
    return this.svc.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.svc.remove(id, req.user.sub);
  }

  @Post(':id/register-team/:teamId')
  @UseGuards(JwtAuthGuard)
  registerTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.svc.registerTeam(id, teamId);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.getStandings(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: TournamentStatus, @Request() req: { user: { sub: string } }) {
    return this.svc.updateStatus(id, status, req.user.sub);
  }
}
