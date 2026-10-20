import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../auth.service.js';
import { mockValidUser, mockLockedUser, mockRegisterInput, mockLoginInput } from '../data-mock/auth.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { RegisterSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSChema } from '../../auth.schema.js';

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

    it('[AUTH-VAL-01] Validation: Chặn đăng ký khi username < 3 ký tự hoặc chứa ký tự đặc biệt', () => {
      const shortUser = RegisterSchema.safeParse({
        body: { username: 'ab', email: 'test@example.com', password: 'Password123@' },
        query: {},
        params: {}
      });
      expect(shortUser.success).toBe(false);

      const invalidCharUser = RegisterSchema.safeParse({
        body: { username: 'user@name!', email: 'test@example.com', password: 'Password123@' },
        query: {},
        params: {}
      });
      expect(invalidCharUser.success).toBe(false);
    });

    it('[AUTH-VAL-02] Validation: Chặn đăng ký khi email sai định dạng hoặc vượt quá 100 ký tự', () => {
      const invalidEmail = RegisterSchema.safeParse({
        body: { username: 'validuser', email: 'not-an-email', password: 'Password123@' },
        query: {},
        params: {}
      });
      expect(invalidEmail.success).toBe(false);

      const longEmail = RegisterSchema.safeParse({
        body: { username: 'validuser', email: 'a'.repeat(95) + '@example.com', password: 'Password123@' },
        query: {},
        params: {}
      });
      expect(longEmail.success).toBe(false);
    });

    it('[AUTH-VAL-03] Validation: Chặn đăng ký khi mật khẩu yếu (thiếu chữ hoa, thường, số hoặc ký tự đặc biệt)', () => {
      const noUpper = RegisterSchema.safeParse({
        body: { username: 'validuser', email: 'test@example.com', password: 'password123@' },
        query: {},
        params: {}
      });
      expect(noUpper.success).toBe(false);

      const noSpecial = RegisterSchema.safeParse({
        body: { username: 'validuser', email: 'test@example.com', password: 'Password1234' },
        query: {},
        params: {}
      });
      expect(noSpecial.success).toBe(false);

      const shortPass = RegisterSchema.safeParse({
        body: { username: 'validuser', email: 'test@example.com', password: 'Pass1!' },
        query: {},
        params: {}
      });
      expect(shortPass.success).toBe(false);
    });

    it('[AUTH-VAL-04] Validation: Chặn đăng nhập khi để trống identifier hoặc password', () => {
      const emptyLogin = LoginSchema.safeParse({
        body: { identifier: '', password: '' },
        query: {},
        params: {}
      });
      expect(emptyLogin.success).toBe(false);
    });

    it('[AUTH-VAL-05] Validation: Chặn đổi mật khẩu khi mật khẩu mới không đạt chuẩn bảo mật', () => {
      const weakNewPass = ChangePasswordSchema.safeParse({
        body: { oldPassword: 'Password123@', newPassword: 'simplepassword' },
        query: {},
        params: {}
      });
      expect(weakNewPass.success).toBe(false);
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

  describe('6. Bảo Mật Thu Hồi Session & Chống Tái Sử Dụng Token (Session Revocation & Anti-Replay)', () => {
    it('[AUTH-SEC-01] Thu hồi Session an toàn: Logout đưa Access Token vào danh sách đen (revoked_token) và đánh dấu Refresh Token isRevoked = true', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        userId: 1,
        user: { id: 1, username: 'testuser' },
      });

      const res = await authService.logout('refresh_to_revoke', 'access_to_blacklist', 1);

      expect(res.message).toBe('Đăng xuất thành công');
      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalledWith('hash_refresh_to_revoke');
      expect(mockAuthRepo.createRevokedToken).toHaveBeenCalledWith({
        accesstokenHash: 'hash_access_to_blacklist',
        userId: 1,
        description: 'Người dùng chủ động đăng xuất khỏi hệ thống',
      });
    });

    it('[AUTH-SEC-02] Chống Replay Refresh Token: Kẻ tấn công dùng Refresh Token đã bị revoke để lấy token mới -> Bị từ chối 401 và toàn bộ Session bị triệt hạ', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 1,
        sessionId: 'hacked_session',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: false },
      });

      await expect(authService.refreshToken('stolen_token')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 401, code: 'token_revoked' })
      );

      // Cả session bị thu hồi sạch sẽ để ngăn kẻ tấn công
      expect(mockAuthRepo.revokeAllSessionToken).toHaveBeenCalledWith('hacked_session');
    });

    it('[AUTH-SEC-03] Chống dùng lại Access Token cũ sau khi Refresh (Token Rotation): Access Token cũ trước đó bị đưa vào blacklist ngay lập tức', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 1,
        sessionId: 'session_rotation',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: false, role: 'user' },
      });

      await authService.refreshToken('valid_refresh', 'old_access_token');

      // Access token cũ bị đưa vào bảng revoked_token để chặn kẻ tấn công tái sử dụng
      expect(mockAuthRepo.createRevokedToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          description: expect.stringContaining('thu hồi Access Token cũ'),
        })
      );
    });

    it('[AUTH-SEC-04] Phát hiện tấn công Brute-force/Spam Refresh: Hủy tức thì toàn bộ Session và đưa cả Access Token lẫn Refresh Token vào blacklist khi tần suất >= 3 lần/phút', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 1,
        sessionId: 'spam_session',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: false, role: 'user' },
      });
      mockAuthRepo.countTokensInSessionSince.mockResolvedValue(3);

      await expect(authService.refreshToken('spam_token', 'old_access')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 429, code: 'too_many_refresh_requests' })
      );

      expect(mockAuthRepo.revokeAllSessionToken).toHaveBeenCalledWith('spam_session');
      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalled();
      expect(mockAuthRepo.createRevokedToken).toHaveBeenCalled();
    });

    it('[AUTH-SEC-05] Ngăn chặn phiên làm việc của tài khoản bị khóa: Refresh token của user có isLocked = true bị từ chối 403 account_locked', async () => {
      mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
        id: 1,
        userId: 2,
        sessionId: 'sess_locked',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: { isLocked: true },
      });

      await expect(authService.refreshToken('any_token')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403, code: 'account_locked' })
      );
    });
  });
});
