import { loggers } from "../../utils/logger.js";

// 1. Tự nhận diện TẤT CẢ các tên trường chứa các gốc từ nhạy cảm
// (Bắt được: accessToken, old_refresh_token, zaloUserToken, otpCode, clientSecret, userPasswordHash, stripeApiKey, v.v.)
const SENSITIVE_KEY_PATTERN = /(pass(word)?|pwd|token|secret|auth|key|hash|credential|otp|pin|cookie|signature|private|cvv|session)/i;
// 2. Tự nhận diện cấu trúc GIÁ TRỊ nhạy cảm (kể cả khi tên biến bị đặt tùy tiện)
const SENSITIVE_VALUE_PATTERNS = [
    /^Bearer\s+[A-Za-z0-9\-_.]+/i,                       // Chuỗi "Bearer <token>"
    /^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/, // Chuỗi JWT Token chuẩn (eyJ...)
    /^-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----/,           // Private Key
    /^(sk_|pk_|ghp_|gho_|xox[baprs]-)[A-Za-z0-9_-]+/i,   // API Keys phổ biến (Stripe, GitHub, Slack...)
];

function isSensitiveString(val: string): boolean {
    if (typeof val !== "string") return false;
    
    // Kiểm tra các định dạng token/key đã biết
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
        if (pattern.test(val)) return true;
    }
    
    // Nhận diện chuỗi Hash SHA-256 (64 ký tự hex) hoặc chuỗi ngẫu nhiên dài nghi ngờ là token
    if (val.length === 64 && /^[a-fA-F0-9]{64}$/.test(val)) {
        return true;
    }
    return false;
}

function autoSanitize(val: any): any {
    if (val === null || val === undefined) return val;
    // 1. Nếu là chuỗi -> Soi nội dung
    if (typeof val === "string") {
        return isSensitiveString(val) ? "***HIDDEN_SENSITIVE_DATA***" : val;
    }
    // 2. Nếu là Mảng -> Đệ quy duyệt từng phần tử
    if (Array.isArray(val)) {
        return val.map(autoSanitize);
    }
    // 3. Nếu là Object -> Kiểm tra cả Tên Key và Giá Trị
    if (typeof val === "object") {
        // Tránh can thiệp vào các Object đặc biệt như Date, RegExp, Buffer, Error
        if (val instanceof Date || val instanceof RegExp || val instanceof Error) {
            return val;
        }
        const cleanObj: Record<string, any> = {};
        for (const [key, value] of Object.entries(val)) {
            // Nếu tên key khớp với bất kỳ từ khóa nhạy cảm nào -> Ẩn ngay
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                cleanObj[key] = "***HIDDEN***";
            } else {
                // Nếu tên key bình thường -> Vẫn đệ quy kiểm tra giá trị bên trong
                cleanObj[key] = autoSanitize(value);
            }
        }
        return cleanObj;
    }
    return val;
}
function sanitizeArgs(args: any[]) {
    return args.map(autoSanitize);
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