import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  async findAll() {
    return await this.ledgerService.getAllLedgers();
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ledgerService.getOneLedger(id);
  }
}
