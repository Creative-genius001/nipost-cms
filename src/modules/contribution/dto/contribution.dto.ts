import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createContributionDto {
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(['CASH', 'TRSNSFER'])
  type: string;
}
