import  jwt  from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload  { 
    userId: string;
    role: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
    });
}

export const signRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });
}

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token,env.JWT_ACCESS_SECRET) as JwtPayload;
}

export const verifyRefreshTokenn = (token: string): JwtPayload => {
    return jwt.verify(token,env.JWT_REFRESH_SECRET) as JwtPayload;
}