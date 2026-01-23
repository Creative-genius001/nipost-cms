import { connect, model } from 'mongoose';
import { ContributionSchema } from '../config/database/schemas/contribution.schema';
import * as dotenv from 'dotenv';

async function seedDevContributions() {
  dotenv.config();
  await connect(process.env.MONGODB_URI);

  const Contribution = model('Contribution', ContributionSchema);

  const memberObjectId = ['MBR-00005', 'MBR-00008'];

  for (const memberId of memberObjectId) {
    await Contribution.deleteMany({ memberId });

    const dummyContributions = Array.from({ length: 10 }).map((_, i) => ({
      memberId: memberId,
      amount: Math.floor(Math.random() * 20000) + 1000,
      type: Math.random() > 0.5 ? 'CASH' : 'TRANSFER',
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 90),
      ),
    }));

    await Contribution.insertMany(dummyContributions);
  }

  console.log('DEV contributions seeded successfully.....');
  process.exit(0);
}

seedDevContributions();
