const fs = require('fs');
let code = fs.readFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', 'utf8');
code = code.replace(/const res = await createTest/g, 'await createTest');
fs.writeFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', code);
