import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { TeamMemberRole } from '@g3/types';

export class AddMemberDto {
  @IsString() userId: string;
  @IsEnum(TeamMemberRole) role: TeamMemberRole;
  @IsOptional() @IsInt() @Min(1) jerseyNumber?: number;
}
