import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SportType } from '@g3/types';

export class CreateTeamDto {
  @IsString() name: string;
  @IsEnum(SportType) sport: SportType;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsString() themeColor?: string;
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsString() description?: string;
}
