import { Controller, Get, Put, Body, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.users.findById(user.id);
  }

  @Put('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.users.findPublicProfile(id);
  }

  @Post('me/device-token')
  addDeviceToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.users.addDeviceToken(user.id, body.token);
  }

  @Delete('me/device-token')
  removeDeviceToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.users.removeDeviceToken(user.id, body.token);
  }
}
