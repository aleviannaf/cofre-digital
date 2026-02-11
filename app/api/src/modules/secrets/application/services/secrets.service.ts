import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SECRETS_REPOSITORY } from '../../secrets.tokens';
import type { SecretsRepository } from '../../domain/ports/secrets.repository';
import { CryptoService } from '../../../../shared/crypto/crypto.service';

@Injectable()
export class SecretsService {
  constructor(
    @Inject(SECRETS_REPOSITORY) private readonly secretsRepo: SecretsRepository,
    private readonly crypto: CryptoService,
  ) {}

  async create(input: { ownerId: string; title?: string; description?: string; secret: string }) {
    const enc = this.crypto.encrypt(input.secret, 1);

    const saved = await this.secretsRepo.create({
      ownerId: input.ownerId,
      title: input.title ?? null,
      description: input.description ?? null,
      cipherText: enc.cipherText,
      iv: enc.iv,
      authTag: enc.authTag,
      algorithm: enc.algorithm,
      keyVersion: enc.keyVersion,
    });

    // retorno seguro: descriptografado, sem campos internos
    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      secret: input.secret,
      status: saved.status,
      availableAt: saved.availableAt?.toISOString() ?? null,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async getById(input: { ownerId: string; secretId: string }) {
    const s = await this.secretsRepo.findById(input.secretId);
    if (!s) throw new NotFoundException('Secret not found');
    if (s.ownerId !== input.ownerId) throw new ForbiddenException('Not allowed');

    const secret = this.crypto.decrypt({
      cipherText: s.cipherText,
      iv: s.iv,
      authTag: s.authTag ?? '',
      algorithm: 'aes-256-gcm',
      keyVersion: s.keyVersion,
    });

    return {
      id: s.id,
      title: s.title,
      description: s.description,
      secret,
      status: s.status,
      availableAt: s.availableAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
