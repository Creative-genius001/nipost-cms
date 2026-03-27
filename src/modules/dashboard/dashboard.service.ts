import { Request, Response } from 'express';
import { Model, Types } from 'mongoose';
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
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { getStartOfCurrentMonth } from 'src/utils/get-start-of-month';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';
import { AppLogger } from 'src/common/logger/logger.service';

export class DashboardService {
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

  async getDashboardStats(userID: string, memberId: string) {
    const member = await this.memberModel
      .findOne({ _id: new Types.ObjectId(userID) })
      .select('memberId')
      .lean()
      .exec();

    if (member === null) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (member !== null && member.memberId !== memberId) {
      throw new UnauthorizedException('Unauthorized');
    }
    const [
      balance,
      contributionsAgg,
      pendingWithdrawals,
      activeLoans,
      recentLedger,
      contributionChartData,
    ] = await Promise.all([
      this.accountModel
        .findOne({ memberId: member._id })
        .select('balance')
        .lean()
        .exec(),
      this.contributionModel.aggregate([
        { $match: { memberId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      await this.withdrawalModel.countDocuments({
        memberId,
        status: 'PENDING',
      }),

      await this.loanModel.countDocuments({
        memberId,
        status: 'ACTIVE',
      }),

      await this.ledgerModel
        .find({ memberId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),

      await this.contributionModel
        .find({ memberId })
        .sort({ createdAt: -1 })
        .select('amount createdAt')
        .exec(),
    ]).catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error('Error getting Member Dashbaord Stats', { error });
      throw new InternalServerErrorException();
    });

    const totalContributions = contributionsAgg[0]?.total ?? 0;
    const currentContributionBalance = balance?.balance ?? 0;

    return {
      currentContributionBalance,
      totalContributions,
      activeLoans,
      pendingWithdrawals,
      contributionChartData,
      recentLedger,
    };
  }

  async getAdminDashboardStats(role: string) {
    const startOfMonth = getStartOfCurrentMonth();
    if (role !== 'admin') {
      throw new UnauthorizedException('Unauthorized');
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);
    const [
      totalCooperativeBalanceAgg,
      outstandingLoansAgg,
      pendingLoansNum,
      pendingWithdrawalNum,
      totalMembers,
      monthlyInflowAgg,
      monthlyOutflowAgg,
      pendingLoanItems,
      pendingWithdrawalItems,
      chartYearlyData,
    ] = await Promise.all([
      this.accountModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$balance' },
          },
        },
      ]),
      this.loanModel.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
      ]),
      this.loanModel.countDocuments({
        status: 'PENDING',
      }),

      this.withdrawalModel.countDocuments({
        status: 'PENDING',
      }),

      this.memberModel.countDocuments(),

      this.ledgerModel.aggregate([
        {
          $match: {
            direction: 'CREDIT',
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      this.ledgerModel.aggregate([
        {
          $match: {
            direction: 'DEBIT',
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      this.loanModel
        .find({ status: 'PENDING' })
        .select('memberId amount createdAt status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      this.withdrawalModel
        .find({ status: 'PENDING' })
        .select('memberId createdAt amount status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      this.ledgerModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            inflow: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'CREDIT'] }, '$amount', 0],
              },
            },
            outflow: {
              $sum: { $cond: [{ $eq: ['$direction', 'DEBIT'] }, '$amount', 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]).catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error('Error getting Admin Dashbaord Stats', { error });
      throw new InternalServerErrorException();
    });

    const totalCooperativeBalance = totalCooperativeBalanceAgg[0]?.total ?? 0;
    const outstandingLoans = outstandingLoansAgg[0]?.total ?? 0;
    const monthlyInflow = monthlyInflowAgg[0]?.total ?? 0;
    const monthlyOutflow = monthlyOutflowAgg[0]?.total ?? 0;
    const pendingApprovals = pendingLoansNum + pendingWithdrawalNum;

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const chartStats = monthNames.map((month, index) => {
      const monthData = chartYearlyData.find((s) => s._id === index + 1);
      return {
        month,
        inflow: monthData?.inflow || 0,
        outflow: monthData?.outflow || 0,
      };
    });

    return {
      chartStats,
      totalCooperativeBalance,
      outstandingLoans,
      pendingApprovals,
      totalMembers,
      monthlyInflow,
      monthlyOutflow,
      pendingLoanItems,
      pendingWithdrawalItems,
    };
  }
}
