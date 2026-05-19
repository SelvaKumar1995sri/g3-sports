import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../database/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const type = ctx.getType<'http' | 'ws' | 'rpc'>();
    if (type === 'http') {
      return ctx.switchToHttp().getRequest<{ user: User }>().user;
    }
    if (type === 'ws') {
      return ctx.switchToWs().getClient<{ data?: { user: User } }>().data?.user;
    }
    return undefined;
  },
);
