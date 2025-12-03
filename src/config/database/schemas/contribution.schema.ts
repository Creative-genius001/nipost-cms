import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContributionDocument = HydratedDocument<Contribution>;

@Schema({
  collection: 'contributions',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Contribution {
  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })
  memberId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    enum: ['cash', 'transfer'],
    required: true,
  })
  type: 'cash' | 'transfer';

  @Prop({ type: String, required: true })
  paymentReference: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ContributionSchema = SchemaFactory.createForClass(Contribution);

ContributionSchema.index({ memberId: 1 });
ContributionSchema.index({ createdAt: -1 });

ContributionSchema.index({ memberId: 1, createdAt: -1 });
