import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Ledger,
  LedgerDocument,
} from '../../config/database/schemas/ledger.schema';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
  ) {}
  async getAllLedgers(role: string): Promise<Ledger[]> {
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    return this.ledgerModel.find().sort({ createdAt: -1 }).exec();
  }

  async getLedgerByMemberId(memberId: string): Promise<Ledger> {
    return this.ledgerModel.findById(memberId).exec();
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
