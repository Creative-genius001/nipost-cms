import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Ledger,
  LedgerDocument,
} from '../../config/database/schemas/ledger.schema';
import { GetLedgersQueryDto } from './dto/ledger.dto';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
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
      memberId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    if (direction) filter.direction = direction;
    if (type) filter.type = type;
    if (memberId) filter.memberId = memberId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const sort: any = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      this.ledgerModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),

      this.ledgerModel.countDocuments(filter),
    ]);

    return {
      data,
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
