import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ground } from '../../database/entities/ground.entity';
import { GroundsController } from './grounds.controller';
import { GroundsService } from './grounds.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ground])],
  controllers: [GroundsController],
  providers: [GroundsService],
  exports: [GroundsService],
})
export class GroundsModule {}
