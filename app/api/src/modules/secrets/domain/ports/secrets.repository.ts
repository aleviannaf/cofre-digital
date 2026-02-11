export type SecretRecord = {
  id: string;
  ownerId: string;
  title: string | null;
  description: string | null;

  cipherText: string;
  iv: string;
  authTag: string | null;
  algorithm: string;
  keyVersion: number;

  status: 'STORED' | 'AVAILABLE';
  availableAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

export interface SecretsRepository {
  create(input: {
    ownerId: string;
    title?: string | null;
    description?: string | null;
    cipherText: string;
    iv: string;
    authTag?: string | null;
    algorithm: string;
    keyVersion: number;
  }): Promise<SecretRecord>;

  findById(id: string): Promise<SecretRecord | null>;
}
