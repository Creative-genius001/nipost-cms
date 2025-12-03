import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({
  collection: 'accounts',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Account {
  @Prop({
    type: Types.ObjectId,
    ref: 'Member',
    required: true,
  })
  memberId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  balance: number;

  @Prop({ type: Number, default: 0 }) // optional field
  interestRate?: number; // Annual rate applied to the account
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ memberId: 1 });
