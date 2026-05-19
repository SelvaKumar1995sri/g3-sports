import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import {
  JoinMatchPayload,
  ScoreUpdatePayload,
  BracketUpdatePayload,
  WicketPayload,
  MatchStatusPayload,
  JwtPayload,
} from '@g3/types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class ScoreGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ScoreGateway.name);
  private readonly redis: Redis;

  constructor(
    private readonly cfg: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.redis = new Redis({
      host: cfg.get<string>('REDIS_HOST', 'localhost'),
      port: cfg.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });

    this.redis.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  afterInit(_server: Server): void {
    this.logger.log('Score WebSocket gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    // Validate JWT from handshake auth or query token
    const token =
      (client.handshake.auth as { token?: string }).token ??
      (client.handshake.query['token'] as string | undefined);

    if (!token) {
      this.logger.warn(`WS connection rejected — no token (${client.id})`);
      client.emit('exception', { statusCode: 401, message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.cfg.getOrThrow<string>('JWT_SECRET'),
      });
      // Attach decoded user info to the socket for downstream use
      (client.data as { userId: string; role: string }).userId = payload.sub;
      (client.data as { userId: string; role: string }).role = payload.role;
      this.logger.debug(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`WS connection rejected — invalid token (${client.id})`);
      client.emit('exception', { statusCode: 401, message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @MessageBody() payload: JoinMatchPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<{ joined: string }> {
    const room = `match:${payload.match_id}`;
    await client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);

    // Send cached state immediately so late joiners get current score
    const cached = await this.redis.get(`score:${payload.match_id}`);
    if (cached) {
      client.emit('score_update', JSON.parse(cached) as ScoreUpdatePayload);
    }

    return { joined: room };
  }

  @SubscribeMessage('join_tournament')
  async handleJoinTournament(
    @MessageBody() payload: { tournament_id: string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ joined: string }> {
    const room = `tournament:${payload.tournament_id}`;
    await client.join(room);
    return { joined: room };
  }

  async broadcastScoreUpdate(matchId: string, payload: ScoreUpdatePayload): Promise<void> {
    const room = `match:${matchId}`;
    // Cache for 1 hour — late joiners get instant current state
    await this.redis.setex(`score:${matchId}`, 3600, JSON.stringify(payload));
    this.server.to(room).emit('score_update', payload);
  }

  async broadcastMatchStatus(matchId: string, payload: MatchStatusPayload): Promise<void> {
    // Also cache match status so late joiners know current state
    await this.redis.setex(`status:${matchId}`, 3600, JSON.stringify(payload));
    this.server.to(`match:${matchId}`).emit('match_status', payload);
  }

  async broadcastBracketUpdate(
    tournamentId: string,
    payload: BracketUpdatePayload,
  ): Promise<void> {
    this.server.to(`tournament:${tournamentId}`).emit('bracket_update', payload);
  }

  async broadcastWicket(matchId: string, payload: WicketPayload): Promise<void> {
    this.server.to(`match:${matchId}`).emit('wicket', payload);
  }

  async getLiveScore(matchId: string): Promise<ScoreUpdatePayload | null> {
    const cached = await this.redis.get(`score:${matchId}`);
    return cached ? (JSON.parse(cached) as ScoreUpdatePayload) : null;
  }

  async clearMatchCache(matchId: string): Promise<void> {
    await this.redis.del(`score:${matchId}`, `status:${matchId}`);
  }
}
