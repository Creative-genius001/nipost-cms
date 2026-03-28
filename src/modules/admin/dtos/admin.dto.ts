import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMembersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class GetLoansQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['ACTIVE', 'PAID', 'PENDING', 'REJECTED'])
  status?: 'ACTIVE' | 'PAID' | 'PENDING' | 'REJECTED';
}

export class ApproveLoanDto {
  @IsString()
  @IsOptional()
  loanId?: string;

  @IsString()
  memberId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  amount: number;
}

export class RecordWithdrawalDto {
  @IsString()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class RecordContributionDto {
  @IsString()
  memberId: string;

  @IsNumber()
  amount: number;
}
