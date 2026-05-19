import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SuggestUsernamesDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  base?: string;
}
