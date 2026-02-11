import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { UsersRepository, UserRecord } from '../../domain/ports/users.repository';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const u = await this.prismaService.prisma.user.findUnique({ where: { email } });
    return u
      ? {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }
      : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const u = await this.prismaService.prisma.user.findUnique({ where: { id } });
    return u
      ? {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }
      : null;
  }

  async create(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const u = await this.prismaService.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}
