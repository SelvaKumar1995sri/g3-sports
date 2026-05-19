import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CheckUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/, { message: 'Only lowercase letters, numbers, underscores allowed' })
  username: string;
}
