import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/logger.service';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { HttpExceptionsFilter } from './common/filters/http-exceptions.filter';
import cookieParser from 'cookie-parser';

declare const module: any;

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  // app.use(helmet());

  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000'],

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',

    credentials: true,

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  app.useGlobalFilters(new HttpExceptionsFilter(logger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  logger.info(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
