import { connect, model } from 'mongoose';
import { LedgerSchema } from '../config/database/schemas/ledger.schema';
import { ContributionSchema } from '../config/database/schemas/contribution.schema';
import * as dotenv from 'dotenv';

async function seedDevData() {
  dotenv.config();
  await connect(process.env.MONGODB_URI);

  const Ledger = model('Ledger', LedgerSchema);
  const Contribution = model('Contribution', ContributionSchema);

  const memberObjectId = ['MBR-00005', 'MBR-00008'];
  for (const memberId of memberObjectId) {
    await Ledger.deleteMany({ memberId });
    await Contribution.deleteMany({ memberId });

    const contributions = await Contribution.insertMany(
      Array.from({ length: 20 }).map((_, i) => ({
        memberId,
        amount: Math.floor(Math.random() * 20000) + 1000,
        type: Math.random() > 0.5 ? 'CASH' : 'TRANSFER',
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 90),
        ),
      })),
    );

    const ledgers = contributions.map((contribution) => ({
      referenceId: contribution._id,
      category: 'CONTRIBUTION',
      memberId,
      amount: contribution.amount,
      direction: 'CREDIT',
      createdAt: contribution.createdAt,
    }));

    await Ledger.insertMany(ledgers);
  }

  console.log('DEV contributions + ledger seeded successfully');
  process.exit(0);
}

seedDevData();
