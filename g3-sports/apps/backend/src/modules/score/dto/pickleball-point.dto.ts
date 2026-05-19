import { IsString, IsInt, IsIn, Min } from 'class-validator';

export class PickleballPointDto {
  @IsString() matchId: string;
  @IsInt() @Min(1) gameNumber: number;
  @IsIn(['A', 'B']) scoringTeam: 'A' | 'B';
}
