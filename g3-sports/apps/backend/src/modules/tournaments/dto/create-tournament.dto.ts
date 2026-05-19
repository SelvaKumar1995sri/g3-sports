import { IsString, IsEnum, IsDateString, IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { SportType, TournamentFormat } from '@g3/types';

export class CreateTournamentDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsEnum(TournamentFormat) format: TournamentFormat;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsInt() @Min(2) maxTeams?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsObject() rulesConfig?: Record<string, unknown>;
}
