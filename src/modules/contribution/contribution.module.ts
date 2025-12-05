import { Module } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { ContributionController } from './contribution.controller';
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

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: Contribution.name, schema: ContributionSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Ledger.name, schema: LedgerSchema },
    ]),
  ],
  controllers: [ContributionController],
  providers: [ContributionService],
  exports: [ContributionService],
})
export class ContributionModule {}
