import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { AuthGuard } from '@nestjs/passport';
import {
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
  @Post(':id/approve')
  approve(@Req() req: payload, @Param('id') withdrawalId: string) {
    const role = req.user.role;

    const id = req.user.id;
    return this.withdrawalService.approveWithdrawal(withdrawalId, role, id);
  }

  @HttpCode(200)
  @Post(':id/reject')
  reject(@Req() req: payload, @Param('id') withdrawalId: string) {
    const role = req.user.role;
    return this.withdrawalService.rejectWithdrawal(withdrawalId, role);
  }
}
