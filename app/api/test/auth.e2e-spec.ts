import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prismaService = app.get(PrismaService);
  });

  beforeEach(async () => {
    // limpa tabelas relevantes (ordem por FK)
    await prismaService.prisma.secretReleaseHistory.deleteMany();
    await prismaService.prisma.secretReleaseSchedule.deleteMany();
    await prismaService.prisma.secret.deleteMany();
    await prismaService.prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> me', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@email.com', password: 'abc12345' })
      .expect(201);

    expect(register.body.accessToken).toBeTruthy();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@email.com', password: 'abc12345' })
      .expect(201);

    const token = login.body.accessToken as string;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.email).toBe('ana@email.com');
  });
});
