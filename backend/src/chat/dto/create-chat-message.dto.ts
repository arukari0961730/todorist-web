import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimText } from '../../common/utils/normalize';

export class CreateChatMessageDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
