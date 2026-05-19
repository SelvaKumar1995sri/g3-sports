import { IsString, IsInt, IsIn, Min } from 'class-validator';

export class BadmintonPointDto {
  @IsString() matchId: string;
  @IsInt() @Min(1) setNumber: number;
  @IsIn(['A', 'B']) scoringTeam: 'A' | 'B';
}
