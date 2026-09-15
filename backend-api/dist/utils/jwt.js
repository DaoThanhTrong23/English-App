import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const signAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: Math.floor(env.JWT_ACCESS_EXPIRES_IN / 1000)
    });
};
export const signRefreshToken = (payload) => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: Math.floor(env.JWT_REFRESH_EXPIRES_IN / 1000)
    });
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
export const verifyRefreshTokenn = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
