import { NextFunction, Request, Response, Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { LoginSchema, LogoutSchema, RefreshTokenSChema, RegisterSchema } from "./auth.schema.js";
import { GoogleLoginSchema, FacebookLoginSchema } from './auth.schema.js';

import { asyncHandler } from "../../shared/http/async-handler.js";
import { authService } from "./auth.service.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
const Authrouter = Router();

const extractBearerToken = (req: Request): string | undefined => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    return undefined;
};

Authrouter.post("/register", validate(RegisterSchema), asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
        success: true,
        messages: "Đăng ký tài khoản thành công",
        data: result
    });
}));

Authrouter.post("/login", validate(LoginSchema), asyncHandler(async (req, res) => {
    const clientIp = req.ip;
    const result = await authService.login(req.body,clientIp);
    res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data:  result,
    })
}));


Authrouter.post('/google', validate(GoogleLoginSchema), asyncHandler(async (req: Request, res: Response) => {
    const { idToken, deviceInfo } = req.body;
    const ipAddress = req.ip;
    const result = await authService.googleLogin(idToken, deviceInfo, ipAddress);
    res.status(200).json({
        message: "Đăng nhập Google thành công",
        data: result
    });
}));

// Thêm authentica có refresh vì bắt buộc phải đăng nhập mới được làm mới session
Authrouter.post('/facebook', validate(FacebookLoginSchema), asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, deviceInfo } = req.body;
    const ipAddress = req.ip;
    
    const result = await authService.facebookLogin(accessToken, deviceInfo, ipAddress);
    
    res.status(200).json({
        message: "Đăng nhập Facebook thành công",
        data: result
    });
}));


Authrouter.post("/refresh",Authenticate, validate(RefreshTokenSChema), asyncHandler(async (req, res) => {
    const oldAccessToken = extractBearerToken(req);
    const result = await authService.refreshToken(req.body.refreshToken, oldAccessToken);
    res.status(200).json({
        success: true,
        message: "Refresh Token thành công",
        data: result
    });
}));

// Thêm authentica cho logout vì bắt buộc phải đăng nhập mới được logout
Authrouter.post("/logout",Authenticate,validate(LogoutSchema), asyncHandler(async (req,res) => {
    const accessToken = extractBearerToken(req);
    const userId = req.user?.userId;
    const result = await authService.logout(req.body.refreshToken, accessToken, userId);
    res.status(200).json({
        success: true,
        message: result.message
    });
}))

export default Authrouter