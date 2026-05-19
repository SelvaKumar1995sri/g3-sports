import { IsString, IsNotEmpty, IsPhoneNumber, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@g3/types';

export class VerifyOtpDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
