import { Controller, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

interface payload {
  user: {
    id: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/stats')
  create(@Req() req: payload) {
    const memberID = req.user.id;
    return this.dashboardService.getDashboardStats(memberID);
  }
}
