import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { AuthGuard } from '@nestjs/passport';
import { createContributionDto } from './dto/contribution.dto';

interface payload {
  user: {
    id: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('contribution')
export class ContributionController {
  constructor(private readonly contributionService: ContributionService) {}

  @Post('/add')
  create(
    @Req() req: payload,
    @Body() createContributionDto: createContributionDto,
  ) {
    const role = req.user.role;
    return this.contributionService.createContribution(
      createContributionDto,
      role,
    );
  }

  @Get('/:memberId')
  findAllByMember(@Param('memberId') memberId: string) {
    return this.contributionService.getMemberContributions(memberId);
  }

  @Get('/')
  getAll(@Req() req: payload) {
    const role = req.user.role;
    console.log(role);
    return this.contributionService.getAllContributions(role);
  }
}
