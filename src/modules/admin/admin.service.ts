import { Request, Response } from 'express';
import mongoose, { Model, Types } from 'mongoose';
import {
  Contribution,
  ContributionDocument,
} from '../../config/database/schemas/contribution.schema';
import {
  Withdrawal,
  WithdrawalDocument,
} from '../../config/database/schemas/withdrawal.schema';
import {
  Ledger,
  LedgerDocument,
} from '../../config/database/schemas/ledger.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Loan, LoanDocument } from 'src/config/database/schemas/loan.schema';
import {
  Member,
  MemberDocument,
} from 'src/config/database/schemas/member.schema';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';
import { AppLogger } from 'src/common/logger/logger.service';
import {
  ApproveLoanDto,
  GetLoansQueryDto,
  GetMembersQueryDto,
  RecordContributionDto,
  RecordWithdrawalDto,
} from './dtos/admin.dto';

export class AdminService {
  constructor(
    @InjectModel(Contribution.name)
    private contributionModel: Model<ContributionDocument>,
    @InjectModel(Withdrawal.name)
    private withdrawalModel: Model<WithdrawalDocument>,
    @InjectModel(Ledger.name)
    private ledgerModel: Model<LedgerDocument>,
    @InjectModel(Loan.name)
    private loanModel: Model<LoanDocument>,
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly connection: mongoose.Connection,
    private readonly logger: AppLogger,
  ) {}

  async getAllMembers(query: GetMembersQueryDto) {
    const { search } = query;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const filter: any = {};

    if (search)
      filter.$or = [
        { memberId: { $regex: search, $options: 'i' } },
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];

    const skip = (page - 1) * limit;

    const [data, total, memberStats] = await Promise.all([
      this.memberModel.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },

        { $skip: skip },
        { $limit: limit },

        {
          $lookup: {
            from: 'accounts',
            localField: '_id',
            foreignField: 'memberId',
            as: 'accountData',
          },
        },

        {
          $lookup: {
            from: 'loans',
            localField: 'memberId',
            foreignField: 'memberId',
            as: 'loansData',
          },
        },

        {
          $addFields: {
            totalSavings: {
              $ifNull: [{ $arrayElemAt: ['$accountData.balance', 0] }, 0],
            },
            totalLoans: { $sum: '$loansData.amount' },
          },
        },

        {
          $project: {
            password: 0,
            accountData: 0,
            loansData: 0,
          },
        },
      ]),

      this.memberModel.countDocuments(filter),

      this.memberModel.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { status: 'active' } }, { $count: 'count' }],
            inactive: [{ $match: { status: 'inactive' } }, { $count: 'count' }],
            suspended: [
              { $match: { status: 'suspended' } },
              { $count: 'count' },
            ],
          },
        },
      ]),
    ]).catch((err) => {
      this.logger.error('Failed to get members', err);
      throw new InternalServerErrorException();
    });

    const facet = memberStats[0];
    const stats = {
      totalMembers: facet.total[0]?.count || 0,
      activeMembers: facet.active[0]?.count || 0,
      inactiveMembers: facet.inactive[0]?.count || 0,
      suspendedMembers: facet.suspended[0]?.count || 0,
    };

    return {
      data,
      stats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllLoans(query: GetLoansQueryDto) {
    const { status } = query;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const filter: any = {};

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [data, total, loanStats] = await Promise.all([
      this.loanModel.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },

        { $skip: skip },
        { $limit: limit },

        {
          $lookup: {
            from: 'members',
            localField: 'memberId',
            foreignField: 'memberId',
            as: 'memberDetails',
          },
        },

        {
          $addFields: {
            memberFirstname: {
              $arrayElemAt: ['$memberDetails.firstname', 0],
            },
            memberLastname: { $arrayElemAt: ['$memberDetails.lastname', 0] },
            memberIdentifier: { $arrayElemAt: ['$memberDetails.memberId', 0] },
          },
        },

        {
          $project: {
            memberDetails: 0,
          },
        },
      ]),

      this.loanModel.countDocuments(filter),

      this.loanModel.aggregate([
        {
          $facet: {
            active: [{ $match: { status: 'ACTIVE' } }, { $count: 'count' }],
            paid: [{ $match: { status: 'PAID' } }, { $count: 'count' }],
            pending: [{ $match: { status: 'PENDING' } }, { $count: 'count' }],
            rejected: [{ $match: { status: 'REJECTED' } }, { $count: 'count' }],
          },
        },
      ]),
    ]).catch((err) => {
      this.logger.error('Failed to get loans', err);
      throw new InternalServerErrorException();
    });

    const facet = loanStats[0];
    const stats = {
      activeLoans: facet.active[0]?.count || 0,
      paidLoans: facet.paid[0]?.count || 0,
      pendingLoans: facet.pending[0]?.count || 0,
      rejectedLoans: facet.rejected[0]?.count || 0,
    };

    return {
      data,
      stats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllContributions() {
    const [data, totalStats] = await Promise.all([
      this.contributionModel.find().limit(5).exec(),
      this.contributionModel.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]).catch((err) => {
      this.logger.error('Failed to get contributions data', err);
      throw new InternalServerErrorException();
    });

    const numberOfContributions = totalStats[0]?.count || 0;
    const totalContributions = totalStats[0]?.totalAmount || 0;

    return {
      data,
      numberOfContributions,
      totalContributions,
    };
  }

  async recordLoanApproval(
    payload: ApproveLoanDto,
  ): Promise<{ message: string }> {
    const { memberId, reason, amount } = payload;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const member = await this.memberModel
        .findOne({ memberId })
        .session(session);
      if (!member) throw new BadRequestException('Member not found');
      const account = await this.accountModel
        .findOne({ memberId: member._id })
        .session(session);
      if (!account) throw new BadRequestException('Account not found');

      const [loan] = await this.loanModel.create(
        [
          {
            memberId,
            amount,
            outstandingBalance: amount,
            status: 'ACTIVE',
            appliedDate: new Date().toISOString(),
            accountId: account._id,
            reason: reason || 'Personal Loan',
            statusHistory: [
              {
                status: 'ACTIVE',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
        { session },
      );
      await this.ledgerModel.create(
        [
          {
            referenceId: new Types.ObjectId(loan._id),
            category: 'LOAN',
            memberId: loan.memberId,
            direction: 'DEBIT',
            amount: loan.amount,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return { message: 'Loan successfully committed' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to record loan approval', error);
      throw new InternalServerErrorException('Failed to record loan approval');
    } finally {
      await session.endSession();
    }
  }

  async recordLoanRepayment(
    payload: ApproveLoanDto,
  ): Promise<{ message: string }> {
    const { memberId, amount } = payload;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const loan = await this.loanModel.findOneAndUpdate(
        { memberId, status: 'ACTIVE' },
        { $inc: { outstandingBalance: -amount } },
        { session },
      );

      await this.ledgerModel.create(
        [
          {
            referenceId: new Types.ObjectId(loan._id),
            category: 'REPAYMENT',
            memberId: new Types.ObjectId(memberId),
            direction: 'CREDIT',
            amount,
          },
        ],
        { session },
      );
      await session.commitTransaction();

      return { message: 'Loan repayment successfully committed' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to record loan repayment', error);
      throw new InternalServerErrorException('Failed to record loan repayment');
    } finally {
      await session.endSession();
    }
  }

  async recordWithdrawal(
    payload: RecordWithdrawalDto,
  ): Promise<{ message: string }> {
    const { memberId, amount } = payload;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const [withdrawal] = await this.withdrawalModel.create(
        [
          {
            memberId,
            amount,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
          },
        ],
        { session },
      );

      await this.ledgerModel.create(
        [
          {
            referenceId: new Types.ObjectId(withdrawal._id),
            category: 'WITHDRAWAL',
            memberId: new Types.ObjectId(memberId),
            direction: 'DEBIT',
            amount,
          },
        ],
        { session },
      );

      return { message: 'Withdrawal successfully committed' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to record withdrawal', error);
      throw new InternalServerErrorException('Failed to record withdrawal');
    } finally {
      await session.endSession();
    }
  }

  async recordContribution(
    payload: RecordContributionDto,
  ): Promise<{ message: string }> {
    const { memberId, amount } = payload;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const [contribution] = await this.contributionModel.create(
        [
          {
            memberId: new Types.ObjectId(memberId),
            amount,
            type: 'CASH',
          },
        ],
        { session },
      );

      await this.ledgerModel.create(
        [
          {
            referenceId: new Types.ObjectId(contribution._id),
            category: 'CONTRIBUTION',
            memberId: new Types.ObjectId(memberId),
            direction: 'CREDIT',
            amount,
          },
        ],
        { session },
      );
      await session.commitTransaction();
      return { message: 'Contribution successfully committed' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to record contribution', error);
      throw new InternalServerErrorException('Failed to record contribution');
    } finally {
      await session.endSession();
    }
  }
}
