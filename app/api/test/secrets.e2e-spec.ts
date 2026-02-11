import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('Secrets (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY_BASE64 = Buffer.from('a'.repeat(32)).toString('base64');

    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prismaService = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.prisma.secretReleaseHistory.deleteMany();
    await prismaService.prisma.secretReleaseSchedule.deleteMany();
    await prismaService.prisma.secret.deleteMany();
    await prismaService.prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and retrieves a secret (owner only)', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@email.com', password: 'abc12345' })
      .expect(201);

    const token = register.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/secrets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'GitHub', description: 'token', secret: 'TOP-SECRET' })
      .expect(201);

    expect(created.body.secret).toBe('TOP-SECRET');
    expect(created.body.id).toBeTruthy();

    const fetched = await request(app.getHttpServer())
      .get(`/secrets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(fetched.body.secret).toBe('TOP-SECRET');
  });
});
