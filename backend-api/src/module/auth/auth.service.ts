import { env } from "../../config/env.js";
import { ApiError } from "../../shared/http/api-error.js";
import { BcryptCompare, bcryptHash, generatedSessionId, hashSHA256 } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshTokenn } from "../../utils/jwt.js";
import { authRepository, AuthRepository } from "./auth.repository.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";

export class AuthService {
    constructor(private authRepo: AuthRepository = authRepository) { }

    private async createToken(userId: number, role: string, sessionId: string, deviceInfo?: string) {
        const accessToken = signAccessToken({ userId, role });
        const refreshToken = signRefreshToken({
            userId,
            sessionId,
            role
        });

        const tokenHash = hashSHA256(refreshToken);
        const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN);

        await this.authRepo.createRefreshToken({
            userId,
            sessionId,
            tokenHash,
            deviceInfo,
            expiresAt
        });

        return { accessToken, refreshToken };
    }

    @logExecution()
    @recordActivity("USER_LOGIN", (result) => `Người dùng ${result.user.username} đăng nhập thành công`)
    async login(data: LoginInput, clientIp?: string) {
        // 1. Tìm kiếm User
        const user = await this.authRepo.findUserbyIdentifier(data.identifier);
        if (!user) {
            throw new ApiError(401, "invalid_credential", "Email/Username hoặc mật khẩu không chính xác");
        }

        // 2. Kiểm tra password
        const isMatch = await BcryptCompare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new ApiError(401, "invalid_credential", "Email/Username hoặc mật khẩu không chính xác");
        }

        const sessionId = generatedSessionId();
        const { accessToken, refreshToken } = await this.createToken(user.id, user.role, sessionId, data.deviceInfo);

        await Promise.all([
            this.authRepo.updateLastLogin(user.id),
            this.authRepo.createLoginLog({
                userId: user.id,
                ipAddress: clientIp,
                deviceInfo: data.deviceInfo
            }),
        ]);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                xpPoint: user.xpPoints
            },
            token: {
                accessToken,
                refreshToken
            }
        };
    }

    @logExecution()
    async refreshToken(oldRefreshToken: string) {
        verifyRefreshTokenn(oldRefreshToken);

        const oldRefreshTokenHash = hashSHA256(oldRefreshToken);
        const savedToken = await this.authRepo.findRefreshTokenByHash(oldRefreshTokenHash);

        if (!savedToken) {
            throw new ApiError(401, "token_not_found", "Refresh Token không tồn tại hoặc không hợp lệ");
        }

        if (savedToken.isRevoked) {
            await this.authRepo.revokeAllSessionToken(savedToken.sessionId);
            throw new ApiError(401, "Token_revoked", "Phiên đăng nhập đã bị huỷ. Vui lòng đăng nhập lại");
        }

        if (new Date() > savedToken.expiresAt) {
            throw new ApiError(401, "token_expired", "Refresh Token đã hết hạn. Vui lòng đăng nhập lại");
        }

        await this.authRepo.revokeRefreshToken(oldRefreshTokenHash);

        const { accessToken, refreshToken } = await this.createToken(
            savedToken.userId,
            savedToken.user.role,
            savedToken.sessionId,
            savedToken.deviceInfo ?? undefined
        );

        return { accessToken, refreshToken };
    }

    @logExecution()
    @recordActivity("USER_LOGOUT", (result) => `Người dùng ${result.user.username} đăng xuất thành công`)
    async logout(refreshToken: string) {
        const tokenHash = hashSHA256(refreshToken);
        const existing = await this.authRepo.findRefreshTokenByHash(tokenHash);
        if (!existing) {
            await this.authRepo.revokeRefreshToken(tokenHash);
        }
        return { message: "Đăng xuất thành công" };
    }

    @logExecution()
    @recordActivity("USER_REGISTER", (result) => `Đăng ký tài khoản mới: ${result.username}`)
    async register(data: RegisterInput) {
        const [existingEmail, existingUsername] = await Promise.all([
            this.authRepo.findUserByEmail(data.email),
            this.authRepo.findUserByUsername(data.username),
        ]);
        if (existingEmail) {
            throw new ApiError(409, "email_already_exists", "Email này đã được đăng ký");
        }
        if (existingUsername) {
            throw new ApiError(409, "username_already_exists", "Username này đã được sử dụng");
        }

        const passwordHash = await bcryptHash(data.password);
        const newUser = await this.authRepo.createUser({
            username: data.username,
            email: data.email,
            passwordHash,
        });
        return newUser;
    }
}

export const authService = new AuthService();