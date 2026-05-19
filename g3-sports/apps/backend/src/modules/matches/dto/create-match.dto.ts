import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateMatchDto {
  @IsString() tournamentId: string;
  @IsString() teamAId: string;
  @IsString() teamBId: string;
  @IsEnum(SportType) sport: SportType;
  @IsOptional() @IsString() groundId?: string;
  @IsOptional() @IsInt() @Min(1) round?: number;
  @IsOptional() @IsString() scheduledAt?: string;
}
