const fs = require('fs');
const file = 'backend-api/src/app.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('reminder.cron.js')) {
  code = "import { startCronJobs } from './cron/reminder.cron.js';\n" + code;
  code = code.replace(/return app\s*}/, '  startCronJobs();\n    return app\n}');
  fs.writeFileSync(file, code);
}
