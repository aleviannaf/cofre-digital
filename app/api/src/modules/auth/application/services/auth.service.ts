import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../../users/users.tokens';
import type { UsersRepository } from '../../../users/domain/ports/users.repository';

import { PasswordHasherService } from './password-hasher.service';

export type JwtPayload = { sub: string; email: string };

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepo: UsersRepository,
    private readonly jwt: JwtService,
    private readonly hasher: PasswordHasherService,
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const existing = await this.usersRepo.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.usersRepo.create({ name: input.name, email: input.email, passwordHash });

    const accessToken = await this.signAccessToken({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.usersRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.hasher.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.signAccessToken({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid token');

    return { id: user.id, name: user.name, email: user.email };
  }

  private async signAccessToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload);
  }
}
