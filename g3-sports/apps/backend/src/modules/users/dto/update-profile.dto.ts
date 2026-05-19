import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUrl } from 'class-validator';
import { SportType } from '@g3/types';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(SportType)
  @IsOptional()
  preferredSport?: SportType;

  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  jerseyNumber?: number;

  @IsString()
  @IsOptional()
  battingStyle?: string;

  @IsString()
  @IsOptional()
  username?: string;

}
