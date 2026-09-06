import { createapp } from "./app.js";
import { env } from "./config/env.js";
import { loggers } from "./utils/logger.js";

const app = createapp()
app.listen(env.PORT, () => {
    loggers.info(`API listening on port ${env.PORT}`);
})