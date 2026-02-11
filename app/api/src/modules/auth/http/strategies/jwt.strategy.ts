import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';

import { USERS_REPOSITORY } from '../../../users/users.tokens';
import type { UsersRepository } from '../../../users/domain/ports/users.repository';

export type JwtPayload = {
  sub: string;
  email: string;
};


export type AuthenticatedUser = {
  sub: string; 
  email: string;
  name: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    cfg: ConfigService,
    @Inject(USERS_REPOSITORY) private readonly usersRepo: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user.email !== payload.email) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
