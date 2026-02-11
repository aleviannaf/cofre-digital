import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function ensureEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private readonly client: PrismaClient;

  constructor() {
    const connectionString = ensureEnv('DATABASE_URL');
    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });
  }

  get prisma(): PrismaClient {
    return this.client;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect().catch(() => undefined);
    await this.pool.end().catch(() => undefined);
  }

  async enableShutdownHooks(app: INestApplication) {
    const shutdown = async () => {
      await this.onModuleDestroy();
      await app.close().catch(() => undefined);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
