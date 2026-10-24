import { execSync } from "node:child_process";
import { createapp } from "./app.js";
import { env } from "./config/env.js";
import { loggers } from "./utils/logger.js";
import { permissionService } from "./module/permission/permission.service.js";

if (process.platform === "win32") {
    try {
        execSync("chcp 65001", { stdio: "ignore" });
    } catch {}
}

const app = createapp();
app.listen(env.PORT, async () => {
    loggers.info(`API listening on port ${env.PORT}`);
    // Tự động kiểm tra và khởi tạo / đồng bộ Roles và Permissions
    await permissionService.initRolesAndPermissions().catch((err) => {
        loggers.warn("Không thể đồng bộ RBAC lúc khởi động (sẽ đồng bộ khi có kết nối DB): " + err.message);
    });
});