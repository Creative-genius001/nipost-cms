import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/guard/roles/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles/roles.guard';
import { AppLogger } from 'src/common/logger/logger.service';
import { AdminService } from './admin.service';
import { GetMembersQueryDto } from './dtos/admin.dto';
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: AppLogger,
  ) {}

  @Roles('admin')
  @Get('members/all')
  getAllMembers(@Query() query: GetMembersQueryDto) {
    return this.adminService.getAllMembers(query);
  }
}
