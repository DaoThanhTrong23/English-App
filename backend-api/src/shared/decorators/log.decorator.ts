import { loggers } from "../../utils/logger.js";

export function logExecution() {
    return function (target: any, propertyKey: string, desciptor: PropertyDescriptor) {
        const originalMethod = desciptor.value;

        desciptor.value = async function (...args: any[]) {
            const className = target.contructor.name;
            const start = Date.now();
            // Ghi log báo hàm được tiếp nhận và chuẩn bị được thực thi
            loggers.info(`[AOP BEFORE] ${className}.${propertyKey}() | Params: ${JSON.stringify(args)}`);
            try {
                // Chạy hàm thực thi 
                const result = await originalMethod.apply(this, args);

                //Lấy thời gian thực thi hàm
                const duration = Date.now() - start;

                loggers.info(`[AOP AFTER] ${className}.${propertyKey}() | Time: ${duration}ms`);
                return result;
            } catch (error) {
                const duration = Date.now() - start;
                loggers.error(`[AOP ERROR] ${className}.${propertyKey}() | Time: ${duration}ms | Error: ${error}`);

                throw error;
            };
            return desciptor;
        };
    }
}