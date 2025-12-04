import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Withdrawal,
  WithdrawalDocument,
} from 'src/config/database/schemas/withdrawal.schema';
import { RequestWithdrawalDto } from './dto/withdrawal.dto';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';
import {
  Ledger,
  LedgerDocument,
} from 'src/config/database/schemas/ledger.schema';
import { AppLogger } from 'src/common/logger/logger.service';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Withdrawal.name)
    private readonly withdrawalModel: Model<WithdrawalDocument>,
    private readonly logger: AppLogger,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
    @InjectConnection()
    private readonly connection: mongoose.Connection,
  ) {}

  async requestWithdrawal(
    RequestWithdrawalDto: RequestWithdrawalDto,
  ): Promise<void> {
    const { memberId, amount, reason } = RequestWithdrawalDto;

    const isPendingWithdrawal = await this.withdrawalModel.findOne({
      memberId,
      status: 'PENDING',
    });

    if (isPendingWithdrawal) {
      throw new BadRequestException('You have a pending withdrawal request');
    }
    const withdrawal = await this.withdrawalModel.create({
      memberId,
      amount,
      reason,
      status: 'PENDING',
    });

    if (!withdrawal) {
      throw new InternalServerErrorException(
        'Failed to create withdrawal request',
      );
    }

    this.logger.info('Request withdrawal', { memberId, amount, reason });
  }

  async approveWithdrawal(withdrawalId: string, role: string, adminId: string) {
    if (role != 'admin') {
      throw new ForbiddenException('Forbidden resource');
    }
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const withdrawal = await this.withdrawalModel
        .findById(withdrawalId)
        .session(session);

      if (!withdrawal) throw new BadRequestException('Withdrawal not found');
      if (withdrawal.status !== 'PENDING')
        throw new BadRequestException('Already processed');

      const account = await this.accountModel
        .findOne({ memberId: withdrawal.memberId })
        .session(session);

      if (account.balance < withdrawal.amount)
        throw new BadRequestException('Insufficient balance');

      account.balance -= withdrawal.amount;
      await account.save({ session });

      await this.ledgerModel.create(
        [
          {
            memberId: withdrawal.memberId,
            referenceId: withdrawal._id,
            category: 'WITHDRAWAL',
            direction: 'DEBIT',
            amount: withdrawal.amount,
          },
        ],
        { session },
      );

      withdrawal.status = 'APPROVED';
      withdrawal.approvedBy = adminId;
      withdrawal.approvedAt = new Date();
      await withdrawal.save({ session });

      await session.commitTransaction();
      return { message: 'Withdrawal approved' };
    } catch (err) {
      await session.abortTransaction();
      throw new InternalServerErrorException(err);
    } finally {
      await session.endSession();
    }
  }
}
