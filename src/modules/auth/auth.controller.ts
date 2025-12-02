/* eslint-disable prettier/prettier */
import { Body, Controller, Ip, Post, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto, SignupDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signup(
    @Body() payload: SignupDto,
    @Req() req: Request,
    @Ip() ip: string
  ){
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || ip;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userAgent: string = req.headers['user-agent'] || 'not-provided';
    return this.authService.signup(payload, userAgent, ipAddress)
  }

  @HttpCode(200)
  @Post('/login')
  async login(
    @Body() payload: LoginDto,
    @Req() req: Request,
    @Ip() ip: string
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || ip;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userAgent: string = req.headers['user-agent'] || 'not-provided';
    return this.authService.login(payload, userAgent, ipAddress)
  }
  
}
