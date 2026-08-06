import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { nullableTrimmedText, trimText } from '../../common/utils/normalize';
import { PullRequestStatus } from '../../generated/prisma/enums';

export class UpdatePullRequestDto {
  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsUUID()
  taskId?: string | null;

  @IsOptional()
  @IsEnum(PullRequestStatus)
  status?: PullRequestStatus;

  @Transform(({ value }) => nullableTrimmedText(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  memo?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
