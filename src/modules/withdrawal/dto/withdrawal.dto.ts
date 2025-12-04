import { IsNotEmpty, IsString } from 'class-validator';

export class RequestWithdrawalDto {
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  reason?: string;
}

export class ApproveWithdrawalDto {
  @IsNotEmpty()
  @IsString()
  withdrawalId: string;
}
