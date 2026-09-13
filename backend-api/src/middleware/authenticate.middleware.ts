import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../shared/http/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { authRepository } from "../module/auth/auth.repository.js";
import { hashSHA256 } from "../utils/hash.js";

export interface AuthenticateRequest extends Request {
    user?: JwtPayload
}

export const Authenticate =async (req: AuthenticateRequest, res: Response, _next: NextFunction ) => {
    const authHeader = req.headers.authorization;

    //Kiểm tra header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'unauthorized', 'Client chưa đăng nhập hoặc thiếu headeer Authorization');
    }

    //Kiểm tra token
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new ApiError(401, 'token_missing', 'Access Token không được để rỗng');
    }

    try {
        const decoded = verifyAccessToken(token);

        const tokenHash = hashSHA256(token);
        const isRevoked = await authRepository.isTokenRevoked(tokenHash);
        if (isRevoked) {
            throw new ApiError(401, 'token_revoked', 'Access Token này đã bị thu hồi/đăng xuất. Vui lòng đăng nhập lại');
        }

        req.user = decoded;
        return _next();
    } catch (error) {
        throw new ApiError(401, 'token_expired_or_invalid', 'Token hết hạn hoặc không hợp lệ')
    }
}