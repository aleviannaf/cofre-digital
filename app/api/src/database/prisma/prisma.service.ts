import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function ensureEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly pool: Pool;
  private readonly client: PrismaClient;

  constructor() {
    // Prisma 7 + adapter: o Client não lê DATABASE_URL do schema.
    // A conexão vem do Pool do pg.
    const connectionString = ensureEnv('DATABASE_URL');

    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);

    this.client = new PrismaClient({ adapter });
  }

  // opcional: expor prisma para repositories (prisma.user, prisma.secret etc.)
  get prisma(): PrismaClient {
    return this.client;
  }

  async onModuleInit() {
    // com adapter, não precisa chamar $connect explicitamente, mas é seguro validar.
    await this.client.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // fecha o app e o pool
    const shutdown = async () => {
      await this.client.$disconnect().catch(() => undefined);
      await this.pool.end().catch(() => undefined);
      await app.close().catch(() => undefined);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
