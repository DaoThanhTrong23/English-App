import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import Authrouter from '../../auth.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { authService } from '../../auth.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { authRepository } from '../../auth.repository.js';
import { prisma } from '../../../../config/prisma.js';
import { hashSHA256 } from '../../../../utils/hash.js';

const revokedTokenHashes = new Set<string>();

vi.mock('../../../../utils/jwt.js', () => ({
  verifyAccessToken: vi.fn().mockImplementation((token: string) => {
    if (token === 'expired_token') {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    }
    if (token === 'invalid_token') {
      const err = new Error('invalid token');
      err.name = 'JsonWebTokenError';
      throw err;
    }
    if (token === 'locked_user_token') {
      return { userId: 99, role: 'user' };
    }
    return { userId: 1, role: 'user' };
  }),
}));

vi.mock('../../auth.repository.js', () => ({
  authRepository: {
    isTokenRevoked: vi.fn().mockImplementation(async (tokenHash: string) => {
      if (revokedTokenHashes.has(tokenHash)) {
        return { access_token_hash: tokenHash, user_id: 1, description: 'Token đã thu hồi' };
      }
      return null;
    }),
  },
}));

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.id === 99) {
          return { id: 99, isLocked: true };
        }
        return { id: 1, isLocked: false };
      }),
    },
  },
}));

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

    it('[AUTH-IT-02b] POST /api/auth/logout thành công khi gửi đúng token hợp lệ', async () => {
      vi.spyOn(authService, 'logout').mockResolvedValue({
        message: 'Đăng xuất thành công',
        user: undefined,
      });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_access_token')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng xuất thành công');
    });
  });

  describe('2. Bad End / Validation Failures', () => {
    it('[AUTH-IT-03] POST /api/auth/login thiếu mật khẩu trả về 422 Validation Error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'valid@example.com',
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

    it('[AUTH-IT-04b] POST /api/auth/logout không gửi header Authorization trả về 401', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some_refresh_token' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });
  });

  describe('3. Bảo Mật Thu Hồi Session & Chống Tấn Công Dùng Token Đã Revoke (Session Revocation Defense)', () => {
    it('[AUTH-IT-SEC-01] Kẻ tấn công dùng Access Token đã bị thu hồi (đã logout) -> Bị Authenticate middleware chặn với HTTP 401 token_revoked', async () => {
      const revokedToken = 'revoked_token_123';
      revokedTokenHashes.add(hashSHA256(revokedToken));

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${revokedToken}`)
        .send({ refreshToken: 'any_refresh' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('token_revoked');
      expect(res.body.message).toContain('thu hồi/đăng xuất');
    });

    it('[AUTH-IT-SEC-02] Kẻ tấn công dùng Refresh Token từ session đã bị thu hồi gọi POST /api/auth/refresh -> Bị chặn với HTTP 401 token_revoked', async () => {
      vi.spyOn(authService, 'refreshToken').mockRejectedValue(
        new ApiError(401, 'token_revoked', 'Phiên đăng nhập đã bị huỷ. Vui lòng đăng nhập lại')
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'revoked_session_refresh_token' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('token_revoked');
    });

    it('[AUTH-IT-SEC-03] Kẻ tấn công spam Refresh Token > 3 lần/phút -> Hệ thống kích hoạt phòng vệ chặn 429 và hủy toàn bộ phiên', async () => {
      vi.spyOn(authService, 'refreshToken').mockRejectedValue(
        new ApiError(429, 'too_many_refresh_requests', 'Cảnh báo bảo mật: Session này đã refresh quá 3 lần trong 1 phút.')
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'spam_refresh_token' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('too_many_refresh_requests');
    });

    it('[AUTH-IT-SEC-04] Kẻ tấn công dùng Token hợp lệ nhưng tài khoản vừa bị Admin khóa -> Bị chặn với HTTP 403 account_locked ngay lập tức', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer locked_user_token')
        .send({ refreshToken: 'any_refresh' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('account_locked');
      expect(res.body.message).toContain('bị khóa');
    });
  });

  describe('4. Data Conflict', () => {
    it('[AUTH-IT-06] POST /api/auth/register khi email đã tồn tại trả về 409 Conflict', async () => {
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
