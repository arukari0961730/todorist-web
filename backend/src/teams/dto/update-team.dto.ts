import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { trimText } from '../../common/utils/normalize';

export class UpdateTeamDto {
  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @Length(1, 30)
  name?: string;

  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
