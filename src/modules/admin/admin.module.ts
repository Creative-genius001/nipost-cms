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
import {
  Member,
  MemberSchema,
} from 'src/config/database/schemas/member.schema';
import { Loan, LoanSchema } from 'src/config/database/schemas/loan.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  Withdrawal,
  WithdrawalSchema,
} from 'src/config/database/schemas/withdrawal.schema';
import {
  Account,
  AccountSchema,
} from 'src/config/database/schemas/account.schema';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: Contribution.name, schema: ContributionSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Ledger.name, schema: LedgerSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
