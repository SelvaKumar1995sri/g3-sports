import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { SuggestUsernamesDto } from './dto/suggest-usernames.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSetupDto } from './dto/admin-setup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** One-time setup — creates the first super_admin. Blocked once an admin exists. */
  @Post('admin/setup')
  adminSetup(@Body() dto: AdminSetupDto) {
    return this.auth.adminSetup(dto);
  }

  /** Admin dashboard login — email + password, returns access_token. */
  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto);
  }

  @Post('send-otp')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  sendOtp(@Body() dto: SendOtpDto) {
    // OTP is initiated by the mobile client directly via Firebase SDK.
    // This endpoint validates phone format server-side and returns confirmation.
    return { message: 'Proceed with Firebase OTP on your mobile client', phone: dto.phone };
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('check-username')
  checkUsername(@Body() dto: CheckUsernameDto) {
    return this.auth.checkUsername(dto.username);
  }

  @Post('suggest-usernames')
  suggestUsernames(@Body() dto: SuggestUsernamesDto) {
    return this.auth.suggestUsernames(dto.base ?? 'player');
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  refreshToken(@Body() body: { refreshToken: string }) {
    return this.auth.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: { user: User }) {
    // Stateless JWT — client discards tokens.
    // Future: add refresh token blocklist via Redis.
    return { message: 'Logged out successfully', userId: req.user.id };
  }
}
