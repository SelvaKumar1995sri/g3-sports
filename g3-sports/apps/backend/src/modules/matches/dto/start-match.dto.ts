import { IsInt, IsIn, IsString, IsNotEmpty } from 'class-validator';

export class StartMatchDto {
  @IsNotEmpty()
  @IsInt()
  @IsIn([11, 21])
  pointsPerSet: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['GOLDEN_POINT', 'STANDARD'])
  deuceRule: 'GOLDEN_POINT' | 'STANDARD';
}
