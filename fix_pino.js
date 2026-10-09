const fs = require('fs');
const file = 'backend-api/src/cron/reminder.cron.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/loggers\.error\("\[CRON\] Lỗi khi chạy job nhắc nhở: ", error\);/g, 'loggers.error(error, "[CRON] Lỗi khi chạy job nhắc nhở");');
fs.writeFileSync(file, code);
