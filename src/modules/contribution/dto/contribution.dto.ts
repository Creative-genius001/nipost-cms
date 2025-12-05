import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class createContributionDto {
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(['CASH', 'TRSNSFER'])
  type: string;
}
