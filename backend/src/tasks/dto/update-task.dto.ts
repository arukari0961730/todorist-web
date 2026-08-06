import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { DATE_PATTERN } from '../../common/utils/date';
import { nullableTrimmedText, trimText } from '../../common/utils/normalize';
import { TaskStatus } from '../../generated/prisma/enums';

export class UpdateTaskDto {
  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;

  @Transform(({ value }) => nullableTrimmedText(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN)
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN)
  deadline?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
