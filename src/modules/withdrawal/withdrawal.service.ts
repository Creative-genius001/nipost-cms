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
import { GetWithdrawalsQueryDto, RequestWithdrawalDto } from './dto/withdrawal.dto';
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

  async rejectWithdrawal(withdrawalId: string, role: string) {
    if (role != 'admin') {
      throw new ForbiddenException('Forbidden resource');
    }
    const withdrawal = await this.withdrawalModel.findById(withdrawalId);

    if (!withdrawal) throw new BadRequestException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING')
      throw new BadRequestException('Already processed');

    withdrawal.status = 'REJECTED';
    await withdrawal.save();

    return { message: 'Withdrawal rejected' };
  }

  async getAllWithdrawals(role: string, query: GetWithdrawalsQueryDto) {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden resource');
    }

    const { page = 1, limit = 20, status, startDate, endDate } = query;

    const filter: any = {};

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [
      data,
      total,
      totalAprovedWithdrawal,
      totalPendingWithdrawal,
      totalRejectedWithdrawal,
    ] = await Promise.all([
      this.withdrawalModel.find(filter).skip(skip).limit(limit).lean(),

      this.withdrawalModel.countDocuments(filter),

      this.withdrawalModel.countDocuments({
        status: 'APPROVED',
      }),

      this.withdrawalModel.countDocuments({
        status: 'PENDING',
      }),

      this.withdrawalModel.countDocuments({
        status: 'REJECTED',
      }),
    ]).catch((err) => {
      this.logger.error('Failed to get withdrawals', err);
      throw new InternalServerErrorException();
    });

    return {
      data,
      totalAprovedWithdrawal,
      totalPendingWithdrawal,
      totalRejectedWithdrawal,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
