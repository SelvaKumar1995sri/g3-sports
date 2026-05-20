import { IsUUID } from 'class-validator';

export class CompleteMatchDto {
  @IsUUID()
  winnerTeamId: string;
}
