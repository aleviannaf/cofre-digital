import { PasswordHasherService } from '../src/modules/auth/application/services/password-hasher.service';

describe('PasswordHasherService', () => {
  const hasher = new PasswordHasherService();

  it('hashes and verifies password', async () => {
    const hash = await hasher.hash('abc12345');
    expect(hash).not.toEqual('abc12345');

    await expect(hasher.verify(hash, 'abc12345')).resolves.toBe(true);
    await expect(hasher.verify(hash, 'wrong')).resolves.toBe(false);
  });
});
