const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /const score = res\.data\.data\.overallScore \|\| 0;\n\s*finalAnswer = \`\\\[Điểm AI: \$\{score\}%\\\] \$\{textAnswer\}\`;/g,
  "const score = Math.round((res.data.data.overallScore || 0) * 10);\n            finalAnswer = `[Điểm AI: ${score}%] ${textAnswer}`;"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
