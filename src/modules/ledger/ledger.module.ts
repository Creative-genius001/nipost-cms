import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Ledger,
  LedgerSchema,
} from 'src/config/database/schemas/ledger.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ledger.name, schema: LedgerSchema }]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
