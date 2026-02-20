/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsEnum, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLedgersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['CREDIT', 'DEBIT'])
  direction?: 'CREDIT' | 'DEBIT';

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(['createdAt', 'amount', 'direction'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
