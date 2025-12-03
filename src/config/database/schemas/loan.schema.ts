import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDocument = HydratedDocument<Loan>;

@Schema({ collection: 'loans', timestamps: true })
export class Loan {
  @Prop({
    type: Types.ObjectId,
    ref: 'Member',
    required: true,
  })
  memberId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Account',
    unique: true,
    required: true,
  })
  accountId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  principalAmount: number;

  @Prop({ type: Number, required: true })
  interestRate: number;

  @Prop({ type: Number, required: true })
  loanDuration: number;

  @Prop({ type: Date, required: true })
  startDate: Date; // Disbursement date

  @Prop({
    type: String,
    enum: ['ACTIVE', 'PAID_OFF', 'DEFAULT'],
    required: true,
  })
  status: 'ACTIVE' | 'PAID_OFF' | 'DEFAULT';
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
