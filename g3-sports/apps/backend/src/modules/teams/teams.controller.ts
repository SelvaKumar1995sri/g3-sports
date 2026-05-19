import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TeamMemberRole } from '@g3/types';

@Controller('teams')
export class TeamsController {
  constructor(private readonly svc: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { id: string } }) {
    return this.svc.create(dto, req.user.id);
  }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOneWithMembers(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreateTeamDto>, @Request() req: { user: { id: string } }) {
    return this.svc.update(id, dto, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: TeamMemberRole; jerseyNumber?: number },
  ) {
    return this.svc.addMember(id, body.userId, body.role, body.jerseyNumber);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.svc.removeMember(id, userId);
  }
}
