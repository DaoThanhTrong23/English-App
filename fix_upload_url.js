const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/test/test.route.ts', 'utf8');

code = code.replace(
  /http:\/\/localhost:3000\/uploads/g,
  '/uploads'
);

fs.writeFileSync('backend-api/src/module/test/test.route.ts', code);
