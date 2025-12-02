import { Schema, model } from 'mongoose';

const ContributionSchema = new Schema({
  memberId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['cash', 'transfer'],
    required: true,
  },
  paymentReference: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contribution = model('Contribution', ContributionSchema);

export default Contribution;
