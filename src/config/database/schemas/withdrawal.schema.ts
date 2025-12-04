import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WithdrawalDocument = HydratedDocument<Withdrawal>;

@Schema({ collection: 'withdrawals', timestamps: true })
export class Withdrawal {
  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })
  memberId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    required: true,
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Member' })
  approvedBy?: string;

  @Prop({ type: Date })
  approvedAt?: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);

WithdrawalSchema.index({ status: 1 });
WithdrawalSchema.index({ memberId: 1 });
WithdrawalSchema.index({ memberId: 1, status: 1 });
WithdrawalSchema.index({ createdAt: -1 });
