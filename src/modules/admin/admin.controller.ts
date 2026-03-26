import { Controller, Get, UseGuards, Query, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/guard/roles/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles/roles.guard';
import { AppLogger } from 'src/common/logger/logger.service';
import { AdminService } from './admin.service';
import {
  ApproveLoanDto,
  GetLoansQueryDto,
  GetMembersQueryDto,
  RecordContributionDto,
  RecordWithdrawalDto,
} from './dtos/admin.dto';
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: AppLogger,
  ) {}

  @Roles('admin')
  @Get('members/all')
  getAllMembers(@Query() query: GetMembersQueryDto) {
    return this.adminService.getAllMembers(query);
  }

  @Roles('admin')
  @Get('loan/all')
  getAllLoans(@Query() query: GetLoansQueryDto) {
    return this.adminService.getAllLoans(query);
  }

  @Roles('admin')
  @Get('contribution/recent')
  getAllContributions() {
    return this.adminService.getAllContributions();
  }

  @Roles('admin')
  @Post('loan/record')
  recordLoanApproval(@Body() payload: ApproveLoanDto) {
    return this.adminService.recordLoanApproval(payload);
  }

  @Roles('admin')
  @Post('loan/repayment/record')
  recordLoanRepayment(@Body() payload: ApproveLoanDto) {
    return this.adminService.recordLoanRepayment(payload);
  }

  @Roles('admin')
  @Post('withdrawal/record')
  recordWithdrawal(@Body() payload: RecordWithdrawalDto) {
    return this.adminService.recordWithdrawal(payload);
  }

  @Roles('admin')
  @Post('contribution/record')
  recordContribution(@Body() payload: RecordContributionDto) {
    return this.adminService.recordContribution(payload);
  }
}
