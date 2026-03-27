import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
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
    MongooseModule.forFeature([{ name: Ledger.name, schema: LedgerSchema }]),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
