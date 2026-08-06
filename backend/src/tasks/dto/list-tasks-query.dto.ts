import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DATE_PATTERN } from '../../common/utils/date';
import { trimText } from '../../common/utils/normalize';

export class ListTasksQueryDto {
  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  unassigned?: boolean;

  @IsOptional()
  @IsIn(['overdue', 'today', 'upcoming'])
  deadlineScope?: 'overdue' | 'today' | 'upcoming';

  @IsOptional()
  @Matches(DATE_PATTERN)
  startDateFrom?: string;

  @IsOptional()
  @Matches(DATE_PATTERN)
  startDateTo?: string;

  @IsOptional()
  @Matches(DATE_PATTERN)
  deadlineFrom?: string;

  @IsOptional()
  @Matches(DATE_PATTERN)
  deadlineTo?: string;

  @IsOptional()
  @IsIn([
    'deadline',
    'startDate',
    'title',
    'assignee',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sort?:
    | 'deadline'
    | 'startDate'
    | 'title'
    | 'assignee'
    | 'status'
    | 'createdAt'
    | 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}
