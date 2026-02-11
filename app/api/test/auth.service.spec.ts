import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { PasswordHasherService } from '../src/modules/auth/application/services/password-hasher.service';
import type { UsersRepository } from '../src/modules/users/domain/ports/users.repository';

describe('AuthService', () => {
  const usersRepo: jest.Mocked<UsersRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const jwt = new JwtService({ secret: 'test-secret' });
  jest.spyOn(jwt, 'signAsync').mockImplementation(async () => 'token');

  const hasher: jest.Mocked<PasswordHasherService> = {
    hash: jest.fn(async () => 'hash'),
    verify: jest.fn(async () => true),
  } as any;

  const svc = new AuthService(usersRepo, jwt, hasher);

  beforeEach(() => jest.clearAllMocks());

  it('register creates user and returns token', async () => {
    usersRepo.findByEmail.mockResolvedValue(null);
    usersRepo.create.mockResolvedValue({
      id: 'u1',
      name: 'Ana',
      email: 'ana@email.com',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await svc.register({ name: 'Ana', email: 'ana@email.com', password: '12345678' });
    expect(res.accessToken).toBe('token');
    expect(res.user.email).toBe('ana@email.com');
  });

  it('login fails with invalid credentials', async () => {
    usersRepo.findByEmail.mockResolvedValue(null);
    await expect(svc.login({ email: 'x@y.com', password: '123' })).rejects.toThrow();
  });
});
