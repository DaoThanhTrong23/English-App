const fs = require('fs');
let code = fs.readFileSync('backend-api/src/app.ts', 'utf8');

if (!code.includes('notificationRouter')) {
  code = code.replace(
    'import { studentTestRouter } from "./module/student-test/student-test.route.js";',
    'import { studentTestRouter } from "./module/student-test/student-test.route.js";\nimport { notificationRouter } from "./module/notification/notification.route.js";'
  );
  code = code.replace(
    'app.use("/api/student/tests", studentTestRouter);',
    'app.use("/api/student/tests", studentTestRouter);\n    app.use("/api/student/notifications", notificationRouter);'
  );
  fs.writeFileSync('backend-api/src/app.ts', code);
}
