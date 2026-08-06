import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { normalizeEmail, trimText } from '../../common/utils/normalize';

export class RegisterDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @Length(1, 50)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : (value as unknown),
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(10, 128)
  password!: string;

  @IsString()
  @Length(10, 128)
  passwordConfirmation!: string;
}
