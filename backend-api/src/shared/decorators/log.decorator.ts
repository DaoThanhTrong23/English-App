import { loggers } from "../../utils/logger.js";

function sanitizeArgs(args: any[]) {
    return args.map(arg => {
        if (typeof arg === "object" && arg !== null) {
            const clone = { ...arg };
            if ("password" in clone) clone.password = "***HIDDEN***";
            return clone;
        }
        return arg;
    });
}

export function logExecution() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const className = target.constructor?.name || target.name || "Anonymous";
            const start = Date.now();
            const safeArgs = sanitizeArgs(args);

            loggers.info(`[CALL] ${className}.${propertyKey}() | Args: ${JSON.stringify(safeArgs)}`);
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - start;
                loggers.info(`[SUCCESS] ${className}.${propertyKey}() | Time: ${duration}ms`);
                return result;
            } catch (error: any) {
                const duration = Date.now() - start;
                loggers.error(`[FAILED] ${className}.${propertyKey}() | Time: ${duration}ms | Error: ${error.message || error}`);
                throw error;
            }
        };
        return descriptor;
    };
}