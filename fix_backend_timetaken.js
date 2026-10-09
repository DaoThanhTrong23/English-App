const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

// Add fallback to timeTakenMs extraction
code = code.replace(
  /const timeS = sub\.timeTakenMs \/ 1000;/g,
  'const timeS = (sub.timeTakenMs || 5000) / 1000;'
);

code = code.replace(
  /timeTakenMs: sub\.timeTakenMs,/g,
  'timeTakenMs: sub.timeTakenMs || 5000,'
);

fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
