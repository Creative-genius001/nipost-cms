/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from '../../common/logger/logger.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from 'src/config/database/schemas/member.schema';



@Module({
    imports: [
        LoggerModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            global: true,
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                signOptions: { expiresIn: '2d' },
            }),
            inject: [ConfigService],   
        }),
        PassportModule,
        MongooseModule.forFeature([{ name: Member.name, schema: MemberSchema }])
    ],
  controllers: [AuthController],
  providers: [ AuthService, JwtStrategy ],
})
export class AuthModule {}
