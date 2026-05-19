import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { GroundsService } from './grounds.service';
import { CreateGroundDto } from './dto/create-ground.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SportType } from '@g3/types';

@Controller('grounds')
export class GroundsController {
  constructor(private readonly svc: GroundsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGroundDto, @Request() req: { user: { id: string } }) {
    return this.svc.create(dto, req.user.id);
  }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('available')
  available(@Query('sport') sport?: SportType) {
    return this.svc.findAvailable(sport);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreateGroundDto>, @Request() req: { user: { id: string } }) {
    return this.svc.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.svc.remove(id, req.user.id);
  }
}
