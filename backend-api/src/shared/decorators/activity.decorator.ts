import { activityLogRepository } from "../../module/activity-log/activity-log.repository.js";
import { loggers } from "../../utils/logger.js";

export function recordActivity(
    actionType: string,
    getDescription?: (result: any, ...args: any[]) => string
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                // 1. Thực thi hàm nghiệp vụ chính
                const result = await originalMethod.apply(this, args);

                // 2. Tự động lấy userId từ kết quả trả về hoặc tham số đầu vào
                const userId =
                    result?.user?.id ??
                    result?.id ??
                    result?.userId ??
                    (typeof args[0] === "number" ? args[0] : args[0]?.userId) ??
                    null;

                // Tạo nội dung mô tả
                const description = getDescription
                    ? getDescription(result, ...args)
                    : `Thực hiện ${propertyKey} thành công`;

                // 3. Ghi vào CSDL bất đồng bộ (Background - không dùng await để tránh làm chậm response)
                activityLogRepository
                    .createLog({
                        userId,
                        actionType: `${actionType}_SUCCESS`,
                        description,
                    })
                    .catch((err) => {
                        loggers.error(`[ACTIVITY_LOG ERROR] Không thể lưu log thành công: ${err.message}`);
                    });

                return result;
            } catch (error: any) {
                // 4. Ghi log THẤT BẠI khi có lỗi xảy ra (sai mật khẩu, lỗi hệ thống...)
                const userId =
                    error?.userId ??
                    (typeof args[0] === "number" ? args[0] : args[0]?.userId) ??
                    null;

                const failedDescription = `Thất bại khi thực hiện ${propertyKey}: ${error.message || "Lỗi không xác định"}`;

                activityLogRepository
                    .createLog({
                        userId,
                        actionType: `${actionType}_FAILED`,
                        description: failedDescription,
                    })
                    .catch((err) => {
                        loggers.error(`[ACTIVITY_LOG ERROR] Không thể lưu log thất bại: ${err.message}`);
                    });

                // Ném lại lỗi để Middleware ErrorHandler xử lý trả về response cho client
                throw error;
            }
        };

        return descriptor;
    };
}