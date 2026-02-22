import { Controller, Body, Get, UseGuards, Req, Query } from '@nestjs/common';
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
  create(@Req() req: payload, @Query() query: { memberId?: string }) {
    const userID = req.user.id;
    const memberID = query.memberId;
    return this.dashboardService.getDashboardStats(userID, memberID);
  }

  @Get('/overview')
  getOverview(@Req() req: payload) {
    const role = req.user.role;
    return this.dashboardService.getAdminDashboardStats(role);
  }
}
