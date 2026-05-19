import { IsString, IsEnum, IsDateString, IsOptional, IsObject } from 'class-validator';
import { SportType, TournamentFormat } from '@g3/types';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsEnum(TournamentFormat) format: TournamentFormat;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsObject() rulesConfig?: Record<string, unknown>;
}
