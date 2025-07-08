import { IsNumberString, IsOptional } from 'class-validator';
import { RequestStatus, RequestType } from '../enums';

export class FindRequestQueryDto {
  @IsOptional()
  type?: RequestType;

  @IsOptional()
  status?: RequestStatus;

  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
