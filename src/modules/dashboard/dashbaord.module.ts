import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/common/logger/logger.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Contribution,
  ContributionSchema,
} from 'src/config/database/schemas/contribution.schema';
import {
  Ledger,
  LedgerSchema,
} from 'src/config/database/schemas/ledger.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import {
  Withdrawal,
  WithdrawalSchema,
} from 'src/config/database/schemas/withdrawal.schema';
import { Loan, LoanSchema } from 'src/config/database/schemas/loan.schema';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: Contribution.name, schema: ContributionSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Ledger.name, schema: LedgerSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
