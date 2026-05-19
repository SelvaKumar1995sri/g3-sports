import { IsString, IsInt, Min, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { WicketType } from '@g3/types';

export class CricketBallDto {
  @IsString() matchId: string;
  @IsString() battingTeamId: string;
  @IsInt() @Min(0) runs: number;
  @IsOptional() @IsInt() @Min(0) extras?: number;
  @IsOptional() @IsBoolean() isWicket?: boolean;
  @IsOptional() @IsEnum(WicketType) wicketType?: WicketType;
  @IsOptional() @IsBoolean() isWide?: boolean;
  @IsOptional() @IsBoolean() isNoBall?: boolean;
  @IsOptional() @IsInt() @Min(1) innings?: number;
}
