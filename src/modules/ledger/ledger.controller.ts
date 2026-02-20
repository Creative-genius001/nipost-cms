import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { AuthGuard } from '@nestjs/passport';
import { GetLedgersQueryDto } from './dto/ledger.dto';

interface payload {
  user: {
    id: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  async findAll(@Req() req: payload, @Query() query: GetLedgersQueryDto) {
    const role = req.user.role;
    return await this.ledgerService.getAllLedgers(role, query);
  }

  @Get('member/:memberId')
  async findByMemberId(@Param('memberId') memberId: string) {
    return await this.ledgerService.getLedgerByMemberId(memberId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ledgerService.getOneLedger(id);
  }
}
