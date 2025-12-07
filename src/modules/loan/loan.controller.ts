import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoanService } from './loan.service';
import { AuthGuard } from '@nestjs/passport';
import type { payload } from 'src/utils/type';
import { LoanDto } from './dto/loan.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('loan')
export class LoanController {
  constructor(private loanService: LoanService) {}

  @Post('request')
  requestLoan(@Req() req: payload, @Body() dto: LoanDto) {
    const memberId = req.user.memberId;
    return this.loanService.requestLoan(memberId, dto);
  }

  @Get('member/:memberId')
  getMemberLoans(@Req() req: payload) {
    const memberId = req.user.memberId;
    return this.loanService.getMemberLoans(memberId);
  }

  @Get()
  getAllLoans(@Req() req: payload) {
    const role = req.user.role;
    return this.loanService.getAllLoans(role);
  }

  @Post('approve/:id')
  approveLoan(@Req() req: payload, @Param('id') loanId: string) {
    const role = req.user.role;
    const adminId = req.user.id;
    return this.loanService.approveLoan(loanId, role, adminId);
  }

  @Post('reject/:id')
  rejectLoan(@Req() req: payload, @Param('id') loanId: string) {
    const role = req.user.role;
    const adminId = req.user.id;
    return this.loanService.rejectLoan(loanId, role, adminId);
  }

  @Post('paid/:id')
  markAsPaid(@Req() req: payload, @Param('id') loanId: string) {
    const role = req.user.role;
    const adminId = req.user.id;
    return this.loanService.markAsPaid(loanId, role, adminId);
  }
}
