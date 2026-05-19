import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  }, 30000);

  afterAll(() => app.close());

  describe('POST /api/auth/send-otp', () => {
    it('rejects request with missing phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/send-otp')
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects invalid phone format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/send-otp')
        .send({ phone: 'not-a-phone' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/check-username', () => {
    it('returns available: true for a unique username', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/check-username')
        .send({ username: 'newuser_xyz_9999' });
      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });

    it('rejects username shorter than 3 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/check-username')
        .send({ username: 'ab' });
      expect(res.status).toBe(400);
    });

    it('rejects username with invalid characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/check-username')
        .send({ username: 'Bad-Name!' });
      expect(res.status).toBe(400);
    });
  });
});
