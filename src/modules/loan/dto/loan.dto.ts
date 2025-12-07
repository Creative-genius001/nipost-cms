import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LoanDto {
  @IsNotEmpty({ message: 'You must include a reason' })
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsNumber()
  amount: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;
}
