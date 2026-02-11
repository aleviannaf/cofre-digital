import { Module } from '@nestjs/common';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { SecretsController } from './http/secrets.controller';
import { SecretsService } from './application/services/secrets.service';
import { PrismaSecretsRepository } from './infrastructure/persistence/prisma-secrets.repository';
import { SECRETS_REPOSITORY } from './secrets.tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CryptoModule, AuthModule], 
  controllers: [SecretsController],
  providers: [
    SecretsService,
    { provide: SECRETS_REPOSITORY, useClass: PrismaSecretsRepository },
  ],
})
export class SecretsModule {}
