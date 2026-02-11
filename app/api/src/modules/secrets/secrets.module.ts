import { Module } from '@nestjs/common';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { SecretsController } from './http/secrets.controller';
import { SecretsService } from './application/services/secrets.service';
import { PrismaSecretsRepository } from './infrastructure/persistence/prisma-secrets.repository';
import { SECRETS_REPOSITORY } from './secrets.tokens';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '@src/integrations/rabbitmq/rabbitmq.module';
import { SecretReleaseSchedulerService } from './application/services/secret-release-scheduler.service';
import { SchedulesController } from './http/schedules.controller';
import { SecretReleaseConsumerService } from './application/services/secret-release-consumer.service';
import { SecretReleaseProcessorService } from './application/services/secret-release-processor.service';

@Module({
  imports: [CryptoModule, AuthModule, RabbitMQModule], 
  controllers: [
    SecretsController,
    SchedulesController,
   
],
  providers: [
    SecretsService,
     SecretReleaseSchedulerService,
    SecretReleaseConsumerService,
    SecretReleaseProcessorService,
    { provide: SECRETS_REPOSITORY, useClass: PrismaSecretsRepository },
  ],
})
export class SecretsModule {}



