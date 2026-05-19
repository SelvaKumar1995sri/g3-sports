import { IsString, IsIn } from 'class-validator';

export class TossDto {
  @IsString() winnerTeamId: string;
  @IsIn(['bat', 'field', 'serve', 'receive']) decision: 'bat' | 'field' | 'serve' | 'receive';
}
