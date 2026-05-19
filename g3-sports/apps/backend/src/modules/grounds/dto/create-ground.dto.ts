import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateGroundDto {
  @IsString() name: string;
  @IsEnum(SportType) sportType: SportType;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() capacity?: number;
  @IsOptional() @IsString() tournamentId?: string;
}
