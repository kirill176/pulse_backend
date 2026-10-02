import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  readonly password?: string;

  @IsOptional()
  @IsString()
  readonly userName?: string;

  @IsOptional()
  @IsString()
  readonly isVerified?: boolean;
}
