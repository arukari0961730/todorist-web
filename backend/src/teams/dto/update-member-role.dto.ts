import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';
import { TeamRole } from '../../generated/prisma/enums';

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole)
  role!: TeamRole;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
