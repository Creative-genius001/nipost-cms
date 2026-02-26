import { Request, Response } from 'express';
import { Model } from 'mongoose';
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
import { InternalServerErrorException } from '@nestjs/common';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';
import { AppLogger } from 'src/common/logger/logger.service';
import { GetMembersQueryDto } from './dtos/admin.dto';

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
    private readonly logger: AppLogger,
  ) {}

  async getAllMembers(query: GetMembersQueryDto) {
    const { page = 1, limit = 20, search } = query;

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

    const stats = {
      totalMembers: memberStats[0].total[0]?.count || 0,
      activeMembers: memberStats[0].active[0]?.count || 0,
      inactiveMembers: memberStats[0].inactive[0]?.count || 0,
      suspendedMembers: memberStats[0].suspended[0]?.count || 0,
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
}
