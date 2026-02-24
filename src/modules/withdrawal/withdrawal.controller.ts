import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Query,
  Get,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApproveWithdrawalDto,
  GetWithdrawalsQueryDto,
  RequestWithdrawalDto,
} from './dto/withdrawal.dto';

interface payload {
  user: {
    id: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  getAllWithdrawals(
    @Req() req: payload,
    @Query() query: GetWithdrawalsQueryDto,
  ) {
    const role = req.user.role;
    return this.withdrawalService.getAllWithdrawals(role, query);
  }

  @HttpCode(200)
  @Post('/request')
  request(@Body() requestWithdrawalDto: RequestWithdrawalDto) {
    return this.withdrawalService.requestWithdrawal(requestWithdrawalDto);
  }

  @HttpCode(200)
  @Post('/approve')
  approve(
    @Req() req: payload,
    @Body() approveWithdrawalDto: ApproveWithdrawalDto,
  ) {
    const role = req.user.role;

    const id = req.user.id;
    return this.withdrawalService.approveWithdrawal(
      approveWithdrawalDto.withdrawalId,
      role,
      id,
    );
  }
}
