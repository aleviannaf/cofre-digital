import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import type { SecretsRepository, SecretRecord } from '../../domain/ports/secrets.repository';

@Injectable()
export class PrismaSecretsRepository implements SecretsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: {
    ownerId: string;
    title?: string | null;
    description?: string | null;
    cipherText: string;
    iv: string;
    authTag?: string | null;
    algorithm: string;
    keyVersion: number;
  }): Promise<SecretRecord> {
    const s = await this.prismaService.prisma.secret.create({
      data: {
        ownerId: input.ownerId,
        title: input.title ?? null,
        description: input.description ?? null,
        cipherText: input.cipherText,
        iv: input.iv,
        authTag: input.authTag ?? null,
        algorithm: input.algorithm,
        keyVersion: input.keyVersion,
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        cipherText: true,
        iv: true,
        authTag: true,
        algorithm: true,
        keyVersion: true,
        status: true,
        availableAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: s.id,
      ownerId: s.ownerId,
      title: s.title,
      description: s.description,
      cipherText: s.cipherText,
      iv: s.iv,
      authTag: s.authTag,
      algorithm: s.algorithm,
      keyVersion: s.keyVersion,
      status: s.status,
      availableAt: s.availableAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async findById(id: string): Promise<SecretRecord | null> {
    const s = await this.prismaService.prisma.secret.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        cipherText: true,
        iv: true,
        authTag: true,
        algorithm: true,
        keyVersion: true,
        status: true,
        availableAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return s
      ? {
          id: s.id,
          ownerId: s.ownerId,
          title: s.title,
          description: s.description,
          cipherText: s.cipherText,
          iv: s.iv,
          authTag: s.authTag,
          algorithm: s.algorithm,
          keyVersion: s.keyVersion,
          status: s.status,
          availableAt: s.availableAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }
      : null;
  }
}
