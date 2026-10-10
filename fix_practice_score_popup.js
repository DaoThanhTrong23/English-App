const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /\{resultData\.score \|\| 0\}/,
  "{resultData.totalScore || 0}"
);

// Optional: add percentage text as well
code = code.replace(
  /Bạn đã làm được \{resultData\.totalScore \|\| 0\} điểm\./,
  "Bạn đã làm được {resultData.totalScore || 0} / {(resultData.totalQuestions || 0) * 10} điểm."
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
