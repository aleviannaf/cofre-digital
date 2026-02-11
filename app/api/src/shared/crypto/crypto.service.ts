import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

export type EncryptedPayload = {
  cipherText: string; // base64
  iv: string; // base64
  authTag: string; // base64
  algorithm: 'aes-256-gcm';
  keyVersion: number;
};

export type DecryptablePayload = EncryptedPayload;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const keyBase64 = this.config.getOrThrow<string>('ENCRYPTION_KEY_BASE64');
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes (AES-256)');
    }

    this.key = key;
  }

  encrypt(plainText: string, keyVersion = 1): EncryptedPayload {
    const iv = crypto.randomBytes(12); // 96-bit nonce recomendado p/ GCM
    const algorithm: EncryptedPayload['algorithm'] = 'aes-256-gcm';

    const cipher = crypto.createCipheriv(algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      cipherText: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm,
      keyVersion,
    };
  }

  decrypt(payload: DecryptablePayload): string {
    if (payload.algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported algorithm: ${payload.algorithm}`);
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const cipherText = Buffer.from(payload.cipherText, 'base64');

    const decipher = crypto.createDecipheriv(payload.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
