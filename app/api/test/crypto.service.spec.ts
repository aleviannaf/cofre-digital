import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from '../src/shared/crypto/crypto.service';

describe('CryptoService', () => {
  it('encrypts and decrypts using AES-256-GCM', async () => {
    process.env.ENCRYPTION_KEY_BASE64 = Buffer.from('a'.repeat(32)).toString('base64');

    const mod = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [CryptoService],
    }).compile();

    const cryptoSvc = mod.get(CryptoService);

    const payload = cryptoSvc.encrypt('segredo-123');
    expect(payload.cipherText).toBeTruthy();
    expect(payload.iv).toBeTruthy();
    expect(payload.authTag).toBeTruthy();

    const plain = cryptoSvc.decrypt(payload);
    expect(plain).toBe('segredo-123');
  });
});
