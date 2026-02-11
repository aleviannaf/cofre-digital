import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './http/auth.controller';
import { AuthService } from './application/services/auth.service';
import { PasswordHasherService } from './application/services/password-hasher.service';
import { JwtAuthGuard } from './http/guards/jwt-auth.guard';
import { JwtStrategy } from './http/strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: cfg.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, JwtAuthGuard, JwtStrategy],
  exports: [JwtModule, PassportModule, JwtAuthGuard], // exporta para outros módulos usarem @UseGuards
})
export class AuthModule {}
