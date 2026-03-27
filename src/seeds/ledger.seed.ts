import mongoose, { connect, model } from 'mongoose';
import { LedgerSchema } from '../config/database/schemas/ledger.schema';
// Assuming these schemas exist; if not, use LedgerSchema or specific ones
import { LoanSchema } from '../config/database/schemas/loan.schema';
import { WithdrawalSchema } from '../config/database/schemas/withdrawal.schema';
import * as dotenv from 'dotenv';

async function seedDevData() {
  dotenv.config();
  await connect(process.env.MONGODB_URI);

  const Ledger = model('Ledger', LedgerSchema);
  const Loan = model('Loan', LoanSchema);
  const Withdrawal = model('Withdrawal', WithdrawalSchema);

  await Loan.syncIndexes();

  const memberObject = [
    { id: 'MBR-00005', accountId: '6935994f95d8c4f2a2b4ba22' },
    { id: 'MBR-00002', accountId: '699883e579a19e0bcc2aae72' },
  ];

  for (const member of memberObject) {
    // 1. Generate new Loans
    const loans = await Loan.insertMany(
      Array.from({ length: 5 }).map(() => ({
        memberId: member.id,
        accountId: new mongoose.Types.ObjectId(member.accountId),
        amount: Math.floor(Math.random() * 50000) + 5000,
        status: 'ACTIVE',
        reason: 'Personal Loan',
        createdAt: new Date(),
      })),
    );

    // 2. Generate new Withdrawals
    const withdrawals = await Withdrawal.insertMany(
      Array.from({ length: 5 }).map(() => ({
        memberId: member.id,
        amount: Math.floor(Math.random() * 10000) + 1000,
        status: 'APPROVED',
        createdAt: new Date(),
      })),
    );

    // 3. Create Ledger entries for Loans (DEBIT)
    const loanLedgers = loans.map((loan) => ({
      referenceId: loan._id,
      category: 'LOAN',
      memberId: loan.memberId,
      amount: loan.amount,
      direction: 'DEBIT',
      createdAt: loan.createdAt,
    }));

    // 4. Create Ledger entries for Withdrawals (DEBIT)
    const withdrawalLedgers = withdrawals.map((withdrawal) => ({
      referenceId: withdrawal._id,
      category: 'WITHDRAWAL',
      memberId: withdrawal.memberId,
      amount: withdrawal.amount,
      direction: 'DEBIT',
      createdAt: withdrawal.createdAt,
    }));

    // Insert all into Ledger without deleting old data
    await Ledger.insertMany([...loanLedgers, ...withdrawalLedgers]);
  }

  console.log('Successfully appended Loans, Withdrawals, and Ledger entries.');
  process.exit(0);
}

seedDevData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
