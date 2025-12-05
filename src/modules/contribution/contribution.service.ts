import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AppLogger } from 'src/common/logger/logger.service';

import {
  Contribution,
  ContributionDocument,
} from 'src/config/database/schemas/contribution.schema';
import {
  Ledger,
  LedgerDocument,
} from 'src/config/database/schemas/ledger.schema';
import { createContributionDto } from './dto/contribution.dto';
import {
  Member,
  MemberDocument,
} from 'src/config/database/schemas/member.schema';

@Injectable()
export class ContributionService {
  constructor(
    @InjectModel(Contribution.name)
    private contributionModel: Model<ContributionDocument>,
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
    @InjectModel(Ledger.name)
    private ledgerModel: Model<LedgerDocument>,
    private readonly logger: AppLogger,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createContribution(
    contributionData: createContributionDto,
    role: string,
  ): Promise<{ message: string }> {
    const { memberId, amount, type } = contributionData;
    if (role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const member = await this.memberModel
        .findOne({ memberId })
        .session(session);
      if (!member) {
        throw new BadRequestException('Account not found for the member');
      }

      const contribution = new this.contributionModel({
        memberId: memberId,
        type: type,
        amount: amount,
      });
      await contribution.save({ session });

      await this.ledgerModel.create(
        [
          {
            memberId: memberId,
            referenceId: contribution._id,
            category: 'CONTRIBUTION',
            direction: 'CREDIT',
            amount: amount,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return { message: 'contribution successfully added' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to create contribution', error);
      if (error instanceof BadRequestException) {
        throw new BadRequestException('Account not found for the member');
      } else {
        throw new InternalServerErrorException('Failed to create contribution');
      }
    } finally {
      await session.endSession();
    }
  }

  async getMemberContributions(
    memberId: string,
  ): Promise<ContributionDocument[]> {
    try {
      const contributions = await this.contributionModel
        .find({ memberId })
        .sort({ createdAt: -1 })
        .exec();
      return contributions;
    } catch (err) {
      this.logger.error(
        `Failed to get contributions for member ${memberId}`,
        err,
      );
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async getAllContributions(role: string): Promise<ContributionDocument[]> {
    this.logger.debug('role', { role });
    if (role != 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    try {
      const contributions = await this.contributionModel
        .find()
        .sort({ createdAt: -1 })
        .exec();
      return contributions;
    } catch (err) {
      this.logger.error(`Failed to get contributions`, err);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}
