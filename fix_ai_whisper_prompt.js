const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

code = code.replace(
  /const contextPrompt = \[topic, targetSentence\]\.filter\(Boolean\)\.join\("\. "\);/,
  "const contextPrompt = [targetSentence].filter(Boolean).join(\". \");"
);

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
