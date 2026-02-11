import 'dotenv/config';
import { PrismaService } from './prisma.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const count = await prisma.prisma.user.count();
  console.log('User count:', count);

  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
