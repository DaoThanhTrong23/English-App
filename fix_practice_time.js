const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

if (!code.includes('const [startTime, setStartTime] = useState<number>(Date.now());')) {
  code = code.replace(
    /const \[resultData, setResultData\] = useState<any>\(null\);/,
    "const [resultData, setResultData] = useState<any>(null);\n  const [startTime, setStartTime] = useState<number>(Date.now());"
  );
}

// When resetting for the next question, reset the startTime too
code = code.replace(
  /setRecordedUri\(null\);/g,
  "setRecordedUri(null);\n        setStartTime(Date.now());"
);

// Calculate real time
code = code.replace(
  /timeTakenMs: 5000 \/\/ default dummy time to prevent Prisma undefined error/,
  "timeTakenMs: Math.max(1000, Date.now() - startTime)"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
