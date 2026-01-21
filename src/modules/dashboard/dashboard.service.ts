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
  ) {}

  async getDashboardStats(memberID: string) {
    const uid = new Types.ObjectId(memberID);

    const [contributionsAgg, pendingWithdrawals, activeLoans, recentLedger] =
      await Promise.all([
        this.contributionModel.aggregate([
          { $match: { userId: uid } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        this.withdrawalModel.countDocuments({
          userId: uid,
          status: 'pending',
        }),

        this.loanModel.countDocuments({
          userId: uid,
          status: 'ACTIVE',
        }),

        this.ledgerModel
          .find({ userId: uid })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('type amount description createdAt')
          .lean(),
      ]);

    const totalContributions = contributionsAgg[0]?.total ?? 0;

    return {
      totalContributions,
      activeLoans,
      pendingWithdrawals,
      recentLedger,
    };
  }
}
