import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import Authrouter from '../../auth.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { authService } from '../../auth.service.js';

describe('Auth Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', Authrouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[AUTH-IT-01] POST /api/auth/register thành công với mã 201', async () => {
      vi.spyOn(authService, 'register').mockResolvedValue({
        user: {
          id: 1,
          username: 'validuser',
          email: 'valid@example.com',
          role: 'user',
          avatarUrl: null,
          xpPoint: 0,
          xpPoints: 0,
          onboardingCompleted: false,
          cefrLevel: null,
        },
        token: {
          accessToken: 'jwt_mock_token',
          refreshToken: 'refresh_mock_token',
        },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'validuser',
          email: 'valid@example.com',
          password: 'Password123@',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('validuser');
    });

    it('[AUTH-IT-02] POST /api/auth/login thành công với mã 200', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue({
        user: {
          id: 1,
          username: 'validuser',
          email: 'valid@example.com',
          role: 'user',
          avatarUrl: null,
          xpPoint: 10,
          xpPoints: 10,
          onboardingCompleted: true,
          cefrLevel: 'B1',
        },
        token: {
          accessToken: 'jwt_mock_token',
          refreshToken: 'refresh_mock_token',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'valid@example.com',
          password: 'Password123@',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toHaveProperty('accessToken');
    });
  });

  describe('2. Bad End / Validation Failures', () => {
    it('[AUTH-IT-03] POST /api/auth/login thiếu mật khẩu trả về 422 Validation Error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'valid@example.com',
          // thiếu password
        });

      expect(res.status).toBe(422);
    });

    it('[AUTH-IT-04] POST /api/auth/register email không đúng định dạng trả về 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'invalidmail',
          email: 'not-an-email',
          password: 'Password123@',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency / Rate / Security', () => {
    it('[AUTH-IT-05] POST /api/auth/refresh khi session bị spam > 3 lần/phút trả về 429', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(authService, 'refreshToken').mockRejectedValue(
        new ApiError(429, 'too_many_refresh_requests', 'Cảnh báo bảo mật: Session này đã refresh quá 3 lần trong 1 phút.')
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'spam_refresh_token' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('too_many_refresh_requests');
    });
  });

  describe('4. Data Conflict', () => {
    it('[AUTH-IT-06] POST /api/auth/register khi email đã tồn tại trả về 409 Conflict', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(authService, 'register').mockRejectedValue(
        new ApiError(409, 'email_already_exists', 'Email này đã được sử dụng.')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'Password123@',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('email_already_exists');
    });
  });

  describe('5. Network & Infrastructure Failures', () => {
    it('[AUTH-IT-07] POST /api/auth/login khi DB mất kết nối trả về 500 lỗi máy chủ', async () => {
      vi.spyOn(authService, 'login').mockRejectedValue(new Error('Prisma Client failed to connect (P1001)'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'user@example.com',
          password: 'Password123@',
        });

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('internal_error');
    });
  });
});
