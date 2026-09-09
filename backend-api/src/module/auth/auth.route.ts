import { NextFunction, Request, Response, Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { LoginSchema, LogoutSchema, RefreshTokenSChema, RegisterSchema } from "./auth.schema.js";

import { asyncHandler } from "../../shared/http/async-handler.js";
import { authService } from "./auth.service.js";
const Authrouter = Router();

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


Authrouter.post("/refresh", validate(RefreshTokenSChema), asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body.refreshToken);

    res.status(200).json({
        success: true,
        message: "Refresh Token thành công",
        data: result
    })
}));


Authrouter.post("/logout",validate(LogoutSchema), asyncHandler(async (req,res) => {
    const result = await authService.logout(req.body.refreshToken);

    res.status(200).json({
        success: true,
        message: result.message
    })
}))

export default Authrouter