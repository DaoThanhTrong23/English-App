// backend-api/src/middleware/authenticate.middleware.ts
import { NextFunction, Request, Response } from "express";
import { AccessTokenPayload, verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../shared/http/api-error.js";
import { authRepository } from "../module/auth/auth.repository.js";
import { hashSHA256 } from "../utils/hash.js";

declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;
        }
    }
}

export const Authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Kiểm tra header Authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'unauthorized', 'Client chưa đăng nhập hoặc thiếu header Authorization');
        }

        // 2. Tách Token
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new ApiError(401, 'token_missing', 'Access Token không được để rỗng');
        }

        // 3. Verify JWT
        const decoded = verifyAccessToken(token);

        // 4. Kiểm tra blacklist trong bảng revoked_token
        const tokenHash = hashSHA256(token);
        const isRevoked = await authRepository.isTokenRevoked(tokenHash);
        if (isRevoked) {
            throw new ApiError(401, 'token_revoked', 'Access Token này đã bị thu hồi/đăng xuất. Vui lòng đăng nhập lại');
        }

        // 5. Gán user vào req
        req.user = decoded;
        return next();
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(new ApiError(401, 'token_expired_or_invalid', 'Token hết hạn hoặc không hợp lệ'));
    }
};