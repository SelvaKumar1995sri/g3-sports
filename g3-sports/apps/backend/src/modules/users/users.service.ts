import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { RoleRequest, RoleRequestStatus } from '../../database/entities/role-request.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '@g3/types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserProfile) private readonly profiles: Repository<UserProfile>,
    @InjectRepository(RoleRequest) private readonly roleRequests: Repository<RoleRequest>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);

    if (dto.username !== undefined && dto.username !== user.username) {
      const taken = await this.users.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username already taken');
      user.username = dto.username;
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.users.save(user);

    // Create profile if it doesn't exist yet
    if (!user.profile) {
      user.profile = this.profiles.create({ user });
    }
    if (dto.bio !== undefined) user.profile.bio = dto.bio;
    if (dto.city !== undefined) user.profile.city = dto.city;
    if (dto.preferredSport !== undefined) user.profile.preferredSport = dto.preferredSport;
    if (dto.jerseyNumber !== undefined) user.profile.jerseyNumber = dto.jerseyNumber;
    if (dto.battingStyle !== undefined) user.profile.battingStyle = dto.battingStyle;
    await this.profiles.save(user.profile);

    this.logger.log(`Profile updated for user ${userId}`);
    return this.findById(userId);
  }

  async findPublicProfile(id: string): Promise<Partial<User>> {
    const user = await this.findById(id);
    // Exclude phone from public profile — phone is private to the user
    const { phone: _phone, ...publicUser } = user as User & { phone: string };
    return publicUser;
  }

  async addDeviceToken(userId: string, token: string): Promise<{ message: string }> {
    let profile = await this.profiles.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      const user = await this.findById(userId);
      profile = this.profiles.create({ user });
      await this.profiles.save(profile);
    }
    if (!profile.deviceTokens.includes(token)) {
      profile.deviceTokens = [...profile.deviceTokens, token];
      await this.profiles.save(profile);
    }
    return { message: 'Device token registered' };
  }

  async removeDeviceToken(userId: string, token: string): Promise<{ message: string }> {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException('User profile not found');

    profile.deviceTokens = profile.deviceTokens.filter((t) => t !== token);
    await this.profiles.save(profile);
    return { message: 'Device token removed' };
  }

  async findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.users.save(user);
  }

  async requestOrganizerRole(userId: string, reason?: string): Promise<RoleRequest> {
    const existing = await this.roleRequests.findOne({
      where: { user: { id: userId }, status: RoleRequestStatus.PENDING },
    });
    if (existing) throw new BadRequestException('You already have a pending role upgrade request');

    const user = await this.findById(userId);
    if (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('You already have organizer or higher access');
    }

    const request = this.roleRequests.create({
      user: { id: userId } as User,
      reason: reason ?? null,
      status: RoleRequestStatus.PENDING,
    });
    return this.roleRequests.save(request);
  }

  async getMyRoleRequest(userId: string): Promise<RoleRequest | null> {
    return this.roleRequests.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async listRoleRequests(): Promise<RoleRequest[]> {
    return this.roleRequests.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async reviewRoleRequest(
    requestId: string,
    action: 'approve' | 'deny',
  ): Promise<RoleRequest> {
    const req = await this.roleRequests.findOne({
      where: { id: requestId },
      relations: ['user'],
    });
    if (!req) throw new NotFoundException('Role request not found');
    if (req.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('Request already reviewed');
    }

    req.status = action === 'approve' ? RoleRequestStatus.APPROVED : RoleRequestStatus.DENIED;
    req.reviewedAt = new Date();
    await this.roleRequests.save(req);

    if (action === 'approve') {
      req.user.role = UserRole.ORGANIZER;
      await this.users.save(req.user);
    }

    return req;
  }
}
