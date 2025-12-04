import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoggerModule } from './common/logger/logger.module';
import { AppService } from './app.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionsFilter } from './common/filters/http-exceptions.filter';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './config/database/database.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    LedgerModule,
    WithdrawalModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
