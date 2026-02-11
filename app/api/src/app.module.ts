import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { validateEnv } from './config/env';
import { AuthModule } from './modules/auth/auth.module';
import { SecretsModule } from './modules/secrets/secrets.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.docker'],
      validate: () => validateEnv(),
    }),
    PrismaModule,
    AuthModule,
    SecretsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


