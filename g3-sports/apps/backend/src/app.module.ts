import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';   // created in Task 4
import { AuthModule } from './modules/auth/auth.module';       // created in Task 6
import { UsersModule } from './modules/users/users.module';    // created in Task 7
import { UploadModule } from './modules/upload/upload.module'; // created in Task 9
import { GatewayModule } from './modules/gateway/gateway.module'; // created in Task 8

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UploadModule,
    GatewayModule,
  ],
})
export class AppModule {}
