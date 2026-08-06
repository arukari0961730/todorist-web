import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trimText } from '../../common/utils/normalize';

export class CreateTeamDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @Length(1, 30)
  name!: string;

  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
