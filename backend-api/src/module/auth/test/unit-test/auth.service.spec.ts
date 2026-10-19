import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../auth.service.js';
import { mockValidUser, mockLockedUser, mockRegisterInput, mockLoginInput } from '../data-mock/auth.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

vi.mock('../../../../utils/hash.js', () => ({
  BcryptCompare: vi.fn(),
  bcryptHash: vi.fn().mockResolvedValue('mock_hashed_password'),
  generatedSessionId: vi.fn().mockReturnValue('mock_session_id_123'),
  hashSHA256: vi.fn().mockImplementation((val) => `hash_${val}`),
}));

vi.mock('../../../../utils/jwt.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock_access_token'),
  signRefreshToken: vi.fn().mockReturnValue('mock_refresh_token'),
  verifyRefreshTokenn: vi.fn().mockReturnValue({ userId: 1, role: 'user', sessionId: 'sess_1', accessTokenHash: 'hash_old_access' }),
}));

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      update: vi.fn().mockResolvedValue({ id: 1 }),
    },
  },
}));

vi.mock('../../../notification/notification.service.js', () => ({
  notificationService: {
    notifyAdmins: vi.fn().mockResolvedValue(true),
  },
}));

describe('AuthService - Unit Tests (QC 10-Year Standard)', () => {
  let authService: AuthService;
  let mockAuthRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRepo = {
      findUserbyIdentifier: vi.fn(),
      findUserByEmail: vi.fn(),
      findUserByUsername: vi.fn(),
      findUserById: vi.fn(),
      createUser: vi.fn(),
      createRefreshToken: vi.fn(),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
      createLoginLog: vi.fn().mockResolvedValue(undefined),
      findRefreshTokenByHash: vi.fn(),
      revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
      revokeAllSessionToken: vi.fn().mockResolvedValue(undefined),
      countTokensInSessionSince: vi.fn().mockResolvedValue(0),
      createRevokedToken: vi.fn().mockResolvedValue(undefined),
    };
    authService = new AuthService(mockAuthRepo);
  });

  describe('1. Happy Cases', () => {
    it('[AUTH-01] Đăng nhập thành công với thông tin hợp lệ', async () => {
      const { BcryptCompare } = await import('../../../../utils/hash.js');
      vi.mocked(BcryptCompare).mockResolvedValue(true as never);
      mockAuthRepo.findUserbyIdentifier.mockResolvedValue(mockValidUser);

      const result = await authService.login(mockLoginInput, '127.0.0.1');

      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe(mockValidUser.username);
      expect(result).toHaveProperty('token');
      expect(result.token.accessToken).toBe('mock_access_token');
      expect(mockAuthRepo.updateLastLogin).toHaveBeenCalledWith(mockValidUser.id);
      expect(mockAuthRepo.createLoginLog).toHaveBeenCalled();
    });

    it('[AUTH-01b] Đăng ký thành công tài khoản mới', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.findUserByUsername.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue({
        id: 10,
        username: mockRegisterInput.username,
        email: mockRegisterInput.email,
        role: 'user',
        xpPoints: 0,
        onboardingCompleted: false,
        cefrLevel: null,
      });

      const result = await authService.register(mockRegisterInput, '127.0.0.1');

      expect(result.user.username).toBe(mockRegisterInput.username);
      expect(result.token.accessToken).toBe('mock_access_token');
      expect(mockAuthRepo.createUser).toHaveBeenCalled();
    });

    it('[AUTH-01c] Đăng xuất thành công thu hồi refresh token và access token', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        userId: 1,
        user: { id: 1, username: 'testuser' },
      });

      const result = await authService.logout('sample_refresh_token', 'sample_access_token', 1);

      expect(result.message).toBe('Đăng xuất thành công');
      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalled();
      expect(mockAuthRepo.createRevokedToken).toHaveBeenCalled();
    });
  });

  describe('2. Bad End / Negative Cases', () => {
    it('[AUTH-03a] Đăng nhập thất bại do sai mật khẩu', async () => {
      const { BcryptCompare } = await import('../../../../utils/hash.js');
      vi.mocked(BcryptCompare).mockResolvedValue(false as never);
      mockAuthRepo.findUserbyIdentifier.mockResolvedValue(mockValidUser);

      await expect(authService.login(mockLoginInput)).rejects.toThrow(ApiError);
    });

    it('[AUTH-03b] Đăng nhập thất bại do người dùng không tồn tại', async () => {
      mockAuthRepo.findUserbyIdentifier.mockResolvedValue(null);

      await expect(authService.login(mockLoginInput)).rejects.toThrow(ApiError);
    });

    it('[AUTH-04] Từ chối đăng nhập nếu tài khoản bị khóa (isLocked = true)', async () => {
      const { BcryptCompare } = await import('../../../../utils/hash.js');
      vi.mocked(BcryptCompare).mockResolvedValue(true as never);
      mockAuthRepo.findUserbyIdentifier.mockResolvedValue(mockLockedUser);

      await expect(authService.login(mockLoginInput)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403 })
      );
    });

    it('[AUTH-04b] Từ chối refresh token nếu tài khoản đã bị khóa', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 2,
        sessionId: 'sess_locked',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: true },
      });

      await expect(authService.refreshToken('some_token')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403 })
      );
    });
  });

  describe('3. Concurrency & Race Condition', () => {
    it('[AUTH-05] Phát hiện đụng độ / replay refresh token: >= 3 lần refresh/phút hủy toàn bộ phiên', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 1,
        sessionId: 'sess_spam',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: false, role: 'user' },
      });
      // Giả lập đã refresh 3 lần trong 1 phút vừa qua
      mockAuthRepo.countTokensInSessionSince.mockResolvedValue(3);

      await expect(authService.refreshToken('spam_token', 'old_access')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 429 })
      );

      expect(mockAuthRepo.revokeAllSessionToken).toHaveBeenCalledWith('sess_spam');
      expect(mockAuthRepo.createRevokedToken).toHaveBeenCalled();
    });
  });

  describe('4. Data Conflict & Integrity', () => {
    it('[AUTH-06] Xung đột dữ liệu: Chặn đăng ký khi trùng Email đã tồn tại', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(mockValidUser);
      mockAuthRepo.findUserByUsername.mockResolvedValue(null);

      await expect(authService.register(mockRegisterInput)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 409, code: 'email_already_exists' })
      );
    });

    it('[AUTH-06b] Xung đột dữ liệu: Chặn đăng ký khi trùng Tên đăng nhập', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.findUserByUsername.mockResolvedValue(mockValidUser);

      await expect(authService.register(mockRegisterInput)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 409, code: 'username_already_exists' })
      );
    });

    it('[AUTH-07] Xung đột Token: Sử dụng Refresh Token đã bị thu hồi (isRevoked = true) lập tức thu hồi cả session', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 1,
        sessionId: 'stolen_sess',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: false },
      });

      await expect(authService.refreshToken('revoked_token')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 401, code: 'token_revoked' })
      );

      expect(mockAuthRepo.revokeAllSessionToken).toHaveBeenCalledWith('stolen_sess');
    });
  });

  describe('5. Network & Infrastructure Failures', () => {
    it('[AUTH-09] Xử lý an toàn khi mất kết nối DB lúc login', async () => {
      mockAuthRepo.findUserbyIdentifier.mockRejectedValue(new Error('Connection terminated (P1001)'));

      await expect(authService.login(mockLoginInput)).rejects.toThrow('Connection terminated');
    });
  });
});
