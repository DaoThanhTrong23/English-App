import { ApiError } from "../shared/http/api-error.js";
export const authorize = (allowedRole) => {
    return (req, res, _next) => {
        if (!req.user) {
            throw new ApiError(401, 'unauthorized', 'Thông tin người dùng chưa được xác thực');
        }
        if (!allowedRole.includes(req.user.role)) {
            throw new ApiError(403, 'forbidden', 'Bạn không có quyền thực hiện hành động này');
        }
        return _next();
    };
};
