/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  role: string
  memberId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

   validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid access token');
    }
    
    return { id: payload.sub, role: payload.role, memberId: payload.memberId };
  }
}

