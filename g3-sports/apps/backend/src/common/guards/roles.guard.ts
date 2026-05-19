import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@g3/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    let user: User | undefined;
    const type = context.getType<'http' | 'ws' | 'rpc'>();
    if (type === 'http') {
      user = context.switchToHttp().getRequest<{ user: User }>().user;
    } else if (type === 'ws') {
      const client = context.switchToWs().getClient<{ data?: { user: User } }>();
      user = client.data?.user;
    }

    if (!user) return false;
    return requiredRoles.includes(user.role);
  }
}
