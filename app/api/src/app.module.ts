import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { validateEnv } from './config/env';
/* 
@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
 */


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
       envFilePath: ['.env', '.env.local'],
      validate: () => validateEnv(),
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
