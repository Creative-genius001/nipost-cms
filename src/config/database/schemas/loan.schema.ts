import { Schema, model, Types } from 'mongoose';

const LoanSchema = new Schema({
  memberId: {
    type: Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  principal: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'paid'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Loan = model('Loan', LoanSchema);

export default Loan;
