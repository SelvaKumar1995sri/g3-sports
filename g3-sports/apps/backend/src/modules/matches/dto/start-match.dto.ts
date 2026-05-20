import { IsInt, IsIn } from 'class-validator';

export class StartMatchDto {
  @IsInt()
  @IsIn([11, 21])
  pointsPerSet: number;

  @IsIn(['GOLDEN_POINT', 'STANDARD'])
  deuceRule: 'GOLDEN_POINT' | 'STANDARD';
}
