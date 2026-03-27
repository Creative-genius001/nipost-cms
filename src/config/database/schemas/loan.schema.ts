import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDocument = HydratedDocument<Loan>;

@Schema({ collection: 'loans', timestamps: true })
export class Loan {
  @Prop({
    type: String,
    ref: 'Member',
    required: true,
  })
  memberId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Account',
    required: true,
  })
  accountId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number })
  interestRate?: number;

  @Prop({ type: Number })
  loanDuration?: number;

  @Prop({ type: Number })
  outstandingBalance?: number;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: Date })
  appliedDate?: Date;

  @Prop({
    type: String,
    enum: ['ACTIVE', 'PAID', 'PENDING', 'REJECTED'],
    required: true,
    default: 'PENDING',
  })
  status: 'ACTIVE' | 'PAID' | 'PENDING' | 'REJECTED';

  @Prop({
    type: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        changedBy: { type: Types.ObjectId, ref: 'Member' },
      },
    ],
    default: [],
  })
  statusHistory: {
    status: string;
    timestamp: Date;
    changedBy?: Types.ObjectId;
  }[];
}

export const LoanSchema = SchemaFactory.createForClass(Loan);

LoanSchema.index({ memberId: 1 });
LoanSchema.index({ accountId: 1 });
LoanSchema.index({ startDate: 1 });
LoanSchema.index({ status: 1 });

LoanSchema.index({
  memberId: 1,
  accountId: 1,
  status: 1,
  startDate: -1,
});
