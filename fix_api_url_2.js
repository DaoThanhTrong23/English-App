const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  "API_URL}${currentQ.audioUrl}`",
  "API_URL.replace('/api', '')}${currentQ.audioUrl}`"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
