import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../shared/http/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { authRepository } from "../module/auth/auth.repository.js";
import { hashSHA256 } from "../utils/hash.js";

import { prisma } from "../config/prisma.js";

export interface AuthenticateRequest extends Request {
    user?: JwtPayload
}

export const Authenticate = async (req: AuthenticateRequest, res: Response, _next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // Kiểm tra header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return _next(new ApiError(401, 'unauthorized', 'Client chưa đăng nhập hoặc thiếu header Authorization'));
        }

        // Kiểm tra token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return _next(new ApiError(401, 'token_missing', 'Access Token không được để rỗng'));
        }

        const decoded = verifyAccessToken(token);

        const tokenHash = hashSHA256(token);
        const isRevoked = await authRepository.isTokenRevoked(tokenHash);
        if (isRevoked) {
            return _next(new ApiError(401, 'token_revoked', 'Access Token này đã bị thu hồi/đăng xuất. Vui lòng đăng nhập lại'));
        }

        // Khóa tài khoản & đồng bộ vai trò mới nhất từ DB
        const userId = Number(decoded?.userId);
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { role: true }
            });
            if (!user) {
                return _next(new ApiError(401, 'user_not_found', 'Tài khoản người dùng không tồn tại'));
            }
            if (user.isLocked) {
                return _next(new ApiError(403, 'account_locked', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!'));
            }
            req.user = {
                ...decoded,
                userId: user.id,
                role: user.role?.name || "user"
            };
        } else {
            req.user = decoded;
        }
        return _next();
    } catch (error: any) {
        if (error instanceof ApiError) return _next(error);
        // Nếu là lỗi do JWT (hết hạn, sai chữ ký...)
        if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
            return _next(new ApiError(401, 'token_expired_or_invalid', 'Token hết hạn hoặc không hợp lệ'));
        }
        // Nếu là lỗi hệ thống (ví dụ: Prisma lỗi) thì đưa cho ErrorHandler bắt
        return _next(error);
    }
}