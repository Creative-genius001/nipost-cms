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

interface payload {
  user: {
    id: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('loans')
export class LoanController {
  constructor(private loanService: LoanService) {}

  @Post('request/:memberId')
  requestLoan(@Param('memberId') memberId: string, @Body() dto: any) {
    return this.loanService.requestLoan(memberId, dto);
  }

  @Get('member/:memberId')
  getMemberLoans(@Req() req: payload, @Param('memberId') memberId: string) {
    const role = req.user.role;
    return this.loanService.getMemberLoans(role, memberId);
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
