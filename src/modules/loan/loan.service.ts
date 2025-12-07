import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { AppLogger } from 'src/common/logger/logger.service';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';
import {
  Ledger,
  LedgerDocument,
} from 'src/config/database/schemas/ledger.schema';
import { Loan, LoanDocument } from 'src/config/database/schemas/loan.schema';
import { LoanDto } from './dto/loan.dto';

@Injectable()
export class LoanService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(Ledger.name) private ledgerModel: Model<LedgerDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    private readonly logger: AppLogger,
  ) {}

  async requestLoan(memberId: string, dto: LoanDto) {
    //check if member has any unpain loans
    try {
      await this.loanModel.create({
        memberId,
        amount: dto.amount,
        reason: dto.reason,
        accountId: new Types.ObjectId(dto.accountId),
      });

      return { message: 'Loan has been sent for approval' };
    } catch (error) {
      this.logger.error('Loan request error', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async getMemberLoans(memberId: string): Promise<LoanDocument[]> {
    return this.loanModel.find({ memberId }).sort({ createdAt: -1 }).exec();
  }

  async getAllLoans(role: string): Promise<LoanDocument[]> {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    return this.loanModel.find().sort({ createdAt: -1 }).exec();
  }

  async approveLoan(
    loanId: string,
    role: string,
    adminId: string,
  ): Promise<{ message: string }> {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const loan = await this.loanModel.findById(loanId).session(session);
      if (!loan) throw new NotFoundException('Loan not found');

      const account = await this.accountModel
        .findOne({
          memberId: loan.memberId,
        })
        .session(session);
      if (!account) {
        throw new NotFoundException('Account not found for the member');
      }
      account.balance += loan.amount;
      await account.save({ session });

      await this.loanModel.findByIdAndUpdate(
        loanId,
        {
          $set: { status: 'APPROVED', startDate: new Date() },
          $push: {
            statusHistory: {
              status: 'APPROVED',
              changedBy: adminId,
            },
          },
        },
        { session },
      );

      await this.ledgerModel.create(
        [
          {
            referenceId: loan._id,
            category: 'LOAN',
            memberId: loan.memberId,
            type: 'CREDIT',
            amount: loan.amount,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return { message: 'Loan approved successfully' };
    } catch (error) {
      this.logger.error('Loan approval error', error);
      await session.abortTransaction();
      throw new InternalServerErrorException('Loan approval failed');
    } finally {
      await session.endSession();
    }
  }

  async rejectLoan(
    loanId: string,
    role: string,
    adminId: string,
  ): Promise<{ message: string }> {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    await this.loanModel.findByIdAndUpdate(loanId, {
      $set: { status: 'REJECTED' },
      $push: {
        statusHistory: {
          status: 'REJECTED   ',
          changedBy: adminId,
        },
      },
    });

    return { message: 'Loan rejected successfully' };
  }

  async markAsPaid(
    loanId: string,
    role: string,
    adminId: string,
  ): Promise<{ message: string }> {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }

    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    await this.loanModel.findByIdAndUpdate(loanId, {
      $set: { status: 'PAID' },
      $push: {
        statusHistory: {
          status: 'PAID',
          changedBy: adminId,
        },
      },
    });

    return { message: 'Loan marked as paid successfully' };
  }
}
