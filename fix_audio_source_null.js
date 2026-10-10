const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /\) : '';/g,
  ") : null;"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
