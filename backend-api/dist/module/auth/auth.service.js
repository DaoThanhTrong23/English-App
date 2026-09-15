var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { env } from "../../config/env.js";
import { ApiError } from "../../shared/http/api-error.js";
import { BcryptCompare, bcryptHash, generatedSessionId, hashSHA256 } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshTokenn } from "../../utils/jwt.js";
import { authRepository } from "./auth.repository.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
export class AuthService {
    authRepo;
    constructor(authRepo = authRepository) {
        this.authRepo = authRepo;
    }
    async createToken(userId, role, sessionId, deviceInfo) {
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
    async login(data, clientIp) {
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
    async googleLogin(idToken, deviceInfo, ipAddress) {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new ApiError(400, "invalid_token", "Token Google không hợp lệ hoặc thiếu email!");
        }
        const email = payload.email;
        // 2 & 3. Tìm User theo Email
        let user = await this.authRepo.findUserByEmail(email);
        // 4. Nếu chưa có -> Tạo User mới
        if (!user) {
            const baseUsername = email.split('@')[0];
            const randomSuffix = Math.floor(Math.random() * 10000);
            user = await this.authRepo.createUser({
                username: `${baseUsername}${randomSuffix}`,
                email: email,
                passwordHash: "GOOGLE_AUTH_NO_PASSWORD"
            });
        }
        const currentUser = user;
        // 5 & 6. Sinh Session ID và Token
        const sessionId = generatedSessionId();
        const { accessToken, refreshToken } = await this.createToken(currentUser.id, currentUser.role, sessionId, deviceInfo);
        // 7. Lưu Log
        await Promise.all([
            this.authRepo.updateLastLogin(currentUser.id),
            this.authRepo.createLoginLog({
                userId: currentUser.id,
                ipAddress: ipAddress,
                deviceInfo: deviceInfo
            }),
        ]);
        return {
            user: {
                id: currentUser.id,
                username: currentUser.username,
                email: email,
                role: currentUser.role,
                xpPoint: currentUser.xpPoints
            },
            token: {
                accessToken,
                refreshToken
            }
        };
    }
    async facebookLogin(fbAccessToken, deviceInfo, ipAddress) {
        const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${fbAccessToken}&access_token=${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;
        const debugRes = await fetch(debugTokenUrl);
        const debugData = await debugRes.json();
        if (!debugRes.ok || !debugData.data || debugData.data.is_valid !== true) {
            throw new ApiError(400, "invalid_token", "Token Facebook không hợp lệ hoặc đã hết hạn!");
        }
        if (debugData.data.app_id !== env.FACEBOOK_APP_ID) {
            throw new ApiError(403, "invalid_app", "Token này không được cấp cho ứng dụng của chúng tôi!");
        }
        const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${fbAccessToken}`);
        if (!fbRes.ok) {
            throw new ApiError(400, "invalid_token", "Không thể lấy thông tin người dùng từ Facebook!");
        }
        const fbData = await fbRes.json();
        if (!fbData || !fbData.email) {
            throw new ApiError(400, "email_missing", "Tài khoản Facebook của bạn không có Email, hoặc chưa cấp quyền truy cập Email!");
        }
        const email = fbData.email;
        let user = await this.authRepo.findUserByEmail(email);
        if (!user) {
            const baseUsername = email.split('@')[0];
            const randomSuffix = Math.floor(Math.random() * 10000);
            user = await this.authRepo.createUser({
                username: `${baseUsername}${randomSuffix}`,
                email: email,
                passwordHash: "FACEBOOK_AUTH_NO_PASSWORD"
            });
        }
        const currentUser = user;
        const sessionId = generatedSessionId();
        const { accessToken, refreshToken } = await this.createToken(currentUser.id, currentUser.role, sessionId, deviceInfo);
        await Promise.all([
            this.authRepo.updateLastLogin(currentUser.id),
            this.authRepo.createLoginLog({
                userId: currentUser.id,
                ipAddress: ipAddress,
                deviceInfo: deviceInfo
            }),
        ]);
        return {
            user: {
                id: currentUser.id,
                username: currentUser.username,
                email: email,
                role: currentUser.role,
                xpPoint: currentUser.xpPoints
            },
            token: {
                accessToken,
                refreshToken
            }
        };
    }
    async refreshToken(oldRefreshToken, oldAccessToken) {
        verifyRefreshTokenn(oldRefreshToken);
        const oldRefreshTokenHash = hashSHA256(oldRefreshToken);
        const savedToken = await this.authRepo.findRefreshTokenByHash(oldRefreshTokenHash);
        if (!savedToken) {
            throw new ApiError(401, "token_not_found", "Refresh Token không tồn tại hoặc không hợp lệ");
        }
        if (savedToken.isRevoked) {
            await this.authRepo.revokeAllSessionToken(savedToken.sessionId);
            throw new ApiError(401, "token_revoked", "Phiên đăng nhập đã bị huỷ. Vui lòng đăng nhập lại");
        }
        if (new Date() > savedToken.expiresAt) {
            throw new ApiError(401, "token_expired", "Refresh Token đã hết hạn. Vui lòng đăng nhập lại");
        }
        // 1. Đánh dấu thu hồi Refresh Token cũ
        await this.authRepo.revokeRefreshToken(oldRefreshTokenHash);
        // 2. Thu hồi Access Token cũ (nếu có gửi kèm)
        if (oldAccessToken) {
            const oldAccessTokenHash = hashSHA256(oldAccessToken);
            await this.authRepo.createRevokedToken({
                accesstokenHash: oldAccessTokenHash,
                userId: savedToken.userId,
                description: "Tự động thu hồi Access Token cũ khi người dùng làm mới phiên (Refresh Token)"
            });
        }
        // 3. Cấp cặp Token mới
        const { accessToken, refreshToken } = await this.createToken(savedToken.userId, savedToken.user.role, savedToken.sessionId, savedToken.deviceInfo ?? undefined);
        return { accessToken, refreshToken };
    }
    async logout(refreshToken, accessToken, userId) {
        // 1. Thu hồi Refresh Token trong DB
        const tokenHash = hashSHA256(refreshToken);
        const existing = await this.authRepo.findRefreshTokenByHash(tokenHash);
        if (existing) {
            await this.authRepo.revokeRefreshToken(tokenHash);
        }
        const currentUserId = userId || existing?.userId;
        // 2. Nếu có Access Token và xác định được userId -> Lưu vào bảng revoked_token
        if (accessToken && currentUserId) {
            const accessTokenHash = hashSHA256(accessToken);
            await this.authRepo.createRevokedToken({
                accesstokenHash: accessTokenHash,
                userId: currentUserId,
                description: "Người dùng chủ động đăng xuất khỏi hệ thống"
            });
        }
        return {
            message: "Đăng xuất thành công",
            user: existing?.user
        };
    }
    async register(data) {
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
__decorate([
    logExecution(),
    recordActivity("USER_LOGIN", (result) => `Người dùng ${result.user.username} đăng nhập thành công`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "login", null);
__decorate([
    logExecution(),
    recordActivity("GOOGLE_LOGIN", (result) => `Người dùng ${result.user.username} đăng nhập bằng Google`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "googleLogin", null);
__decorate([
    logExecution(),
    recordActivity("FACEBOOK_LOGIN", (result) => `Người dùng ${result.user.username} đăng nhập bằng Facebook`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "facebookLogin", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "refreshToken", null);
__decorate([
    logExecution(),
    recordActivity("USER_LOGOUT", (result) => `Người dùng ${result.user?.username || 'ẩn danh'} đăng xuất thành công`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "logout", null);
__decorate([
    logExecution(),
    recordActivity("USER_REGISTER", (result) => `Đăng ký tài khoản mới: ${result.username}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "register", null);
export const authService = new AuthService();
