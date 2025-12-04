import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApproveWithdrawalDto,
  RequestWithdrawalDto,
} from './dto/withdrawal.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @HttpCode(200)
  @Post('/request')
  request(@Body() requestWithdrawalDto: RequestWithdrawalDto) {
    return this.withdrawalService.requestWithdrawal(requestWithdrawalDto);
  }

  @HttpCode(200)
  @Post('/approve')
  approve(@Req() req, @Body() approveWithdrawalDto: ApproveWithdrawalDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const role = req.user.role as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const id = req.user.id as string;
    return this.withdrawalService.approveWithdrawal(
      approveWithdrawalDto.withdrawalId,
      role,
      id,
    );
  }
}
