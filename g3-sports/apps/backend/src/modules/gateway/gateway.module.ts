import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScoreGateway } from './score.gateway';

@Module({
  imports: [
    // JwtService used in ScoreGateway to validate WS handshake tokens
    JwtModule.register({}),
  ],
  providers: [ScoreGateway],
  exports: [ScoreGateway],
})
export class GatewayModule {}
