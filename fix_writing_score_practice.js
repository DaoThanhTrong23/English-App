const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// The line is: finalAnswer = `[Điểm AI: ${score}%] ${textAnswer}`;
code = code.replace(
  /finalAnswer = \`\[Điểm AI: \$\{score\}%\] \$\{textAnswer\}\`;/,
  "finalAnswer = `[Điểm AI: ${Math.round(score * 10)}%] ${textAnswer}`;\n            setAiResults(prev => [...prev, { type: 'Viết', score: res.data.data.overallScore, feedback: res.data.data.feedback, improved: res.data.data.improvedVersion }]);"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
