import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LedgerDocument = HydratedDocument<Ledger>;

@Schema({
  collection: 'ledgers',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Ledger {
  @Prop({ type: Types.ObjectId, required: true })
  referenceId: Types.ObjectId; // contribution, loan, withdrawal ID

  @Prop({
    type: String,
    enum: ['contribution', 'loan', 'repayment', 'withdrawal'],
    required: true,
  })
  category: 'contribution' | 'loan' | 'repayment' | 'withdrawal';

  @Prop({ type: Types.ObjectId, required: true, ref: 'Member' })
  memberId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  })
  direction: 'credit' | 'debit';

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const LedgerSchema = SchemaFactory.createForClass(Ledger);

LedgerSchema.index({ memberId: 1 });
LedgerSchema.index({ referenceId: 1 });
LedgerSchema.index({ category: 1 });
LedgerSchema.index({ createdAt: -1 });
LedgerSchema.index({ participantId: 1, createdAt: -1 });
LedgerSchema.index({ referenceId: 1, category: 1 });
LedgerSchema.index({ memberId: 1, category: 1 });
LedgerSchema.index({ category: 1, direction: 1 });
