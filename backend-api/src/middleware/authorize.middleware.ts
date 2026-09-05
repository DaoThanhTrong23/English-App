import { NextFunction, Response } from "express"
import { AuthenticateRequest } from "./authenticate.middleware.js"
import { ApiError } from "../shared/http/api-error.js";

export const authorize = (allowedRole: string[]) => {
    return (req: AuthenticateRequest, res: Response, _next: NextFunction) => {
        if (!req.user) {
            throw new ApiError(401, 'unauthorized', 'Thông tin người dùng chưa được xác thực');
        }

        if (!allowedRole.includes(req.user.role)) {
            throw new ApiError(403, 'forbidden', 'Bạn không có quyền thực hiện hành động này');
        }
        return _next();
    }
}