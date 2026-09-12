import  jwt  from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload  { 
    userId: number;
    role: string;
}

export interface RefreshTokenPayload {
    userId: number;
    sessionId: string;
    role: string
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
    });
}

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token,env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export const verifyRefreshTokenn = (token: string): RefreshTokenPayload => {
    return jwt.verify(token,env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}