import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { AuthGuard } from '@nestjs/passport';

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
  async findAll(@Req() req: payload) {
    const role = req.user.role;
    return await this.ledgerService.getAllLedgers(role);
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
