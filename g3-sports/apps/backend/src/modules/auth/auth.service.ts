import {
  Injectable, UnauthorizedException, ForbiddenException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import { UserRole, AuthTokens } from '@g3/types';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSetupDto } from './dto/admin-setup.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserProfile) private readonly profiles: Repository<UserProfile>,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: cfg.getOrThrow('FIREBASE_PROJECT_ID'),
          privateKey: cfg
            .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
            .replace(/\\n/g, '\n'),
          clientEmail: cfg.getOrThrow('FIREBASE_CLIENT_EMAIL'),
        }),
      });
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens & { user: User }> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(dto.idToken);
    } catch (err) {
      this.logger.warn(`Firebase token verification failed: ${String(err)}`);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }

    if (decoded.phone_number !== dto.phone) {
      throw new UnauthorizedException('Phone number does not match token');
    }

    let user = await this.users.findOne({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      user = this.users.create({
        phone: dto.phone,
        firebaseUid: decoded.uid,
        role: dto.role ?? UserRole.PLAYER,
      });
      await this.users.save(user);

      const profile = this.profiles.create({ user });
      await this.profiles.save(profile);
      this.logger.log(`New user registered: ${user.id}`);
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async checkUsername(username: string): Promise<{ available: boolean }> {
    const existing = await this.users.findOne({ where: { username } });
    return { available: !existing };
  }

  async suggestUsernames(base: string): Promise<{ suggestions: string[] }> {
    const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player';
    const candidates = [
      `${clean}_g3`,
      `${clean}${Math.floor(Math.random() * 99)}`,
      `${clean}_sports`,
    ];

    const suggestions: string[] = [];
    for (const c of candidates) {
      if (c.length >= 3 && c.length <= 20) {
        const { available } = await this.checkUsername(c);
        if (available) suggestions.push(c);
      }
    }
    return { suggestions: suggestions.slice(0, 2) };
  }

  async adminSetup(dto: AdminSetupDto): Promise<{ message: string }> {
    const existing = await this.users.findOne({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (existing) {
      throw new ForbiddenException('Admin already exists. Use the login endpoint.');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.users.create({
      email: dto.email,
      password: hashed,
      fullName: dto.displayName,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    await this.users.save(user);
    this.logger.log(`Super admin created: ${dto.email}`);
    return { message: 'Admin created successfully. You can now login.' };
  }

  async adminLogin(dto: AdminLoginDto): Promise<{ access_token: string; user: Record<string, unknown> }> {
    const user = await this.users.findOne({
      where: { email: dto.email, role: UserRole.SUPER_ADMIN, isActive: true },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return {
      access_token: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.fullName ?? 'Admin',
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'),
      });
      const user = await this.users.findOneOrFail({ where: { id: payload.sub, isActive: true } });
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.cfg.getOrThrow('JWT_SECRET'),
        expiresIn: this.cfg.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
