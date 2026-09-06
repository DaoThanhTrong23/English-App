import { env } from "../../config/env.js";
import { ApiError } from "../../shared/http/api-error.js";
import { BcryptCompare, bcryptHash, generatedSessionId, hashSHA256 } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshTokenn } from "../../utils/jwt.js";
import * as authRepo from "./auth.repository.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";

async function createToken(userId: number, role: string, sessionId: string, deviceInfo?: string) {
    const accessToken = signAccessToken({ userId: userId, role: role });
    const refreshToken = signRefreshToken({
        userId: userId,
        sessionId: sessionId,
        role: role
    });

    const tokenHash = hashSHA256(refreshToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN);
    //Tạo Refresh Token trong DB 
    await authRepo.createRefreshToken({
        userId: userId,
        sessionId: sessionId,
        tokenHash: tokenHash,
        deviceInfo: deviceInfo,
        expiresAt: expiresAt
    });

    return {
        accessToken,
        refreshToken
    }
}

export const loginService = async (data: LoginInput, clientIp?: string) => {
    // Tìm kiếm User
    const user = await authRepo.findUserbyIdentifier(data.identifier);
    if (!user) {
        throw new ApiError(401, "invalid_credential", "Email/Username hoặc mật khẩu không chính xác");
    }
    // Kiểm tra password
    const isMatch = await BcryptCompare(data.password, user.passwordHash);
    if (!isMatch) {
        throw new ApiError(401, "invalid_credential", "Email/Username hoặc mật khẩu không chính xác");
    }

    const sessionId = generatedSessionId();

    const { accessToken, refreshToken } = await createToken(user.id, user.role, sessionId, data.deviceInfo)

    await Promise.all([
        authRepo.updateLastLogin(user.id),
        authRepo.createLoginLog({
            userId: user.id,
            ipAddress: clientIp,
            deviceInfo: data.deviceInfo
        }),
    ]);

    return {
        user: {
            id: user.id,
            username: user.username,
            emiail: user.email,
            role: user.role,
            xpPoint: user.xpPoints
        },
        token: {
            accessToken,
            refreshToken
        }
    }
}

export const refreshTokenService = async (oldRefreshToken: string) => {
    let decoded;;

    try {
        decoded = verifyRefreshTokenn(oldRefreshToken);
    } catch {
        throw new ApiError(401, "invalid_refresh_token", "Refresh Token không hợp lệ hoặc đã hết hạn");
    }

    const oldRefreshTokenHash = hashSHA256(oldRefreshToken);
    const savedToken = await authRepo.findRefreshTokenByHash(oldRefreshTokenHash);

    if (!savedToken) {
        throw new ApiError(401, "token_not_found", "Refresh Token không tồn tại hoặc không hợp lệ");
    }

    //Token đã sử dụng để làm mới hoặc đăng 
    if (savedToken.isRevoked) {
        await authRepo.revokeAllSessionToken(savedToken.sessionId);
        throw new ApiError(401, "Token_revoked", "Phiên đăng nhập đã bị huỷ. Vui lòng đăng nhập lại");
    }

    if (new Date() > savedToken.expiresAt) {
        throw new ApiError(401, "token_expired", "Refresh Token đã hết hạn. Vui lòng đăng nhập lại");
    }
    //Thu hồi token vừa sử dụng
    await authRepo.revokeRefreshToken(oldRefreshTokenHash);

    // Sinh cặp token mới 
    const { accessToken, refreshToken } = await createToken(savedToken.userId, savedToken.user.role, savedToken.sessionId, savedToken.deviceInfo ?? undefined);

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    }
}

export const LogoutService = async (refrestoken: string) => {
    const tokenHash = hashSHA256(refrestoken);
    const existing = await authRepo.findRefreshTokenByHash(tokenHash);
    if (!existing) {
        await authRepo.revokeRefreshToken(tokenHash);
    }
    return { message: "Đăng xuất thành công" }
}

export const RegisterService = async (data: RegisterInput) => {
    const [existingEmail, existingUsername] = await Promise.all([
        authRepo.findUserByEmail(data.email),
        authRepo.findUserByUsername(data.username),
    ]);
    if (existingEmail) {
        throw new ApiError(409, "email_already_exists", "Email này đã được đăng ký");
    }
    if (existingUsername) {
        throw new ApiError(409, "username_already_exists", "Username này đã được sử dụng");
    }
    // 2. Hash mật khẩu qua bcrypt
    const passwordHash = await bcryptHash(data.password);
    // 3. Lưu vào DB
    const newUser = await authRepo.createUser({
        username: data.username,
        email: data.email,
        passwordHash,
    });
    return newUser;
}