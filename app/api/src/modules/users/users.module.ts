import { Module } from '@nestjs/common';
import { PrismaUsersRepository } from './infrastructure/persistence/prisma-users.repository';
import { USERS_REPOSITORY } from './users.tokens';

@Module({
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
