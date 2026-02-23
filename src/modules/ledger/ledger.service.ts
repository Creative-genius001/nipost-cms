import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Ledger,
  LedgerDocument,
} from '../../config/database/schemas/ledger.schema';
import { GetLedgersQueryDto } from './dto/ledger.dto';
import {
  Account,
  AccountDocument,
} from 'src/config/database/schemas/account.schema';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}
  async getAllLedgers(role: string, query: GetLedgersQueryDto) {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }

    const {
      page = 1,
      limit = 20,
      direction,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;

    const filter: any = {};

    if (direction) filter.direction = direction;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const sort: any = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [totalBalanceAgg, data, total, numOfCreditsAgg, numOfDebitsAgg] =
      await Promise.all([
        this.accountModel.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$balance' },
            },
          },
        ]),

        this.ledgerModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),

        this.ledgerModel.countDocuments(filter),

        this.ledgerModel.aggregate([
          {
            $match: {
              direction: 'CREDIT',
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
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]),
      ]);

    const numOfCredits = numOfCreditsAgg[0]?.total ?? 0;
    const numOfDebits = numOfDebitsAgg[0]?.total ?? 0;
    const totalBalance = totalBalanceAgg[0]?.total ?? 0;

    return {
      data,
      totalBalance,
      numOfCredits,
      numOfDebits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLedgerByMemberId(memberId: string): Promise<Ledger[]> {
    return this.ledgerModel
      .find({ memberId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getLedgerByCategoryAndMemberId(): Promise<Ledger[]> {
    return this.ledgerModel.find().sort({ category: 1, memberId: 1 }).exec();
  }

  async getOneLedger(id: string): Promise<Ledger> {
    return this.ledgerModel.findOne({ _id: id });
  }

  async addLedger(ledgerData: Partial<Ledger>): Promise<Ledger> {
    const newLedger = new this.ledgerModel(ledgerData);
    return newLedger.save();
  }
}
