const fs = require('fs');
let code = fs.readFileSync('backend-api/src/app.ts', 'utf8');

if (!code.includes('import { studentTestRouter }')) {
  code = code.replace(
    'import { studentCourseRouter, studentLessonRouter } from "./module/student-lesson/student-lesson.route.js";',
    'import { studentCourseRouter, studentLessonRouter } from "./module/student-lesson/student-lesson.route.js";\nimport { studentTestRouter } from "./module/student-test/student-test.route.js";'
  );
}

if (!code.includes('app.use("/api/student/tests", studentTestRouter)')) {
  code = code.replace(
    'app.use("/api/student/lessons", studentLessonRouter);',
    'app.use("/api/student/lessons", studentLessonRouter);\n    app.use("/api/student/tests", studentTestRouter);'
  );
}
fs.writeFileSync('backend-api/src/app.ts', code);
