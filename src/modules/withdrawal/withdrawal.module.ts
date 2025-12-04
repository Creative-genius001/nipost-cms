import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import {
  Withdrawal,
  WithdrawalSchema,
} from 'src/config/database/schemas/withdrawal.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Ledger,
  LedgerSchema,
} from 'src/config/database/schemas/ledger.schema';
import {
  Account,
  AccountSchema,
} from 'src/config/database/schemas/account.schema';
import { LoggerModule } from 'src/common/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Ledger.name, schema: LedgerSchema },
    ]),
  ],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
})
export class WithdrawalModule {}
