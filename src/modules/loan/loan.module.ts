import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { Loan, LoanSchema } from 'src/config/database/schemas/loan.schema';
import { LoggerModule } from 'src/common/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([{ name: Loan.name, schema: LoanSchema }]),
  ],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
