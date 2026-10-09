const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

code = code.replace(/const assessmentHistories = \[\];/g, 'const assessmentHistories: any[] = [];');
code = code.replace(/q\.questionType === 'true_false' \|\| /g, '');
code = code.replace(/q\.questionType === 'fill_in_the_blank'/g, "q.questionType === 'fill_in_blank'");

fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
