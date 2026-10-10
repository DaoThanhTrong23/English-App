const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');
code = code.replace(
  /prompt: currentItem\.quesionText/g,
  "topic: currentItem.quesionText"
);
fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
