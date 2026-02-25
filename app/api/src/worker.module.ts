import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { PrismaModule } from './database/prisma/prisma.module';
import { RabbitMQModule } from './integrations/rabbitmq/rabbitmq.module';
import { SecretReleaseConsumerService } from './modules/secrets/application/services/secret-release-consumer.service';
import { SecretReleaseProcessorService } from './modules/secrets/application/services/secret-release-processor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.docker'],
      validate: () => validateEnv(),
    }),
    PrismaModule,
    RabbitMQModule,
  ],
  providers: [SecretReleaseConsumerService, SecretReleaseProcessorService],
})
export class WorkerModule {}
