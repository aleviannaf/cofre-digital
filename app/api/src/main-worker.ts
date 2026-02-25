import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { PrismaService } from './database/prisma/prisma.service';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);

  await app.init();
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  console.log('Worker started');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});