import { Controller, Get, Put, Body, Param, Post, Delete, Patch, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '@g3/types';

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

  @Post('me/device-token')
  addDeviceToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.users.addDeviceToken(user.id, body.token);
  }

  @Delete('me/device-token')
  removeDeviceToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.users.removeDeviceToken(user.id, body.token);
  }

  // ─── Admin: list all users + update role (must be before :id wildcard) ────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  listUsers() {
    return this.users.findAll();
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.users.updateRole(id, role);
  }

  // ─── Role Requests (must be before :id wildcard) ──────────────────────────────

  @Post('role-requests')
  requestOrganizerRole(
    @CurrentUser() user: User,
    @Body('reason') reason?: string,
  ) {
    return this.users.requestOrganizerRole(user.id, reason);
  }

  @Get('role-requests/mine')
  getMyRoleRequest(@CurrentUser() user: User) {
    return this.users.getMyRoleRequest(user.id);
  }

  @Get('role-requests')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  listRoleRequests() {
    return this.users.listRoleRequests();
  }

  @Patch('role-requests/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  reviewRoleRequest(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'deny',
  ) {
    return this.users.reviewRoleRequest(id, action);
  }

  // ─── Public profile (wildcard — must be last) ─────────────────────────────────

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.users.findPublicProfile(id);
  }
}
