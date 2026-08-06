import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_PATTERN } from '../../common/utils/date';
import { nullableTrimmedText, trimText } from '../../common/utils/normalize';
import { TaskStatus } from '../../generated/prisma/enums';

export class CreateTaskDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @Length(1, 100)
  title!: string;

  @Transform(({ value }) => nullableTrimmedText(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsString()
  @Matches(DATE_PATTERN)
  startDate!: string;

  @IsString()
  @Matches(DATE_PATTERN)
  deadline!: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
