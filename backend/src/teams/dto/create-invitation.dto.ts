import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { normalizeEmail } from '../../common/utils/normalize';

export class CreateInvitationDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : (value as unknown),
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
