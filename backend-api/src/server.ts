import { execSync } from "node:child_process";
import { createapp } from "./app.js";
import { env } from "./config/env.js";
import { loggers } from "./utils/logger.js";

if (process.platform === "win32") {
    try {
        execSync("chcp 65001", { stdio: "ignore" });
    } catch {}
}


const app = createapp()
app.listen(env.PORT, () => {
    loggers.info(`API listening on port ${env.PORT}`);
})