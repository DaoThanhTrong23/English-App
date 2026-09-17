import  jwt  from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../shared/http/api-error.js";

export interface AccessTokenPayload { 
    userId: number;
    role: string;
}

export interface RefreshTokenPayload {
    userId: number;
    sessionId: string;
    role: string;
    accessTokenHash?: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn:Math.floor( env.JWT_ACCESS_EXPIRES_IN / 1000) 
    });
}

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn:Math.floor( env.JWT_REFRESH_EXPIRES_IN / 1000)
    });
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token,env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export const verifyRefreshTokenn = (token: string): RefreshTokenPayload => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error: any) {
        throw new ApiError(401, "token_expired_or_invalid", "Refresh Token hết hạn hoặc không hợp lệ");
    }
}