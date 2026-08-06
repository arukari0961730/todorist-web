import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { normalizeEmail } from '../../common/utils/normalize';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : (value as unknown),
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}
