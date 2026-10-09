const fs = require('fs');
let code = fs.readFileSync('backend-api/src/app.ts', 'utf8');

code = code.replace(/app\.use\("\/game\/bubble-game", bubbleGameRouter\);/, 'app.use("/api/game/bubble-game", bubbleGameRouter);');
code = code.replace(/app\.use\("\/game\/memory-card", memoryCardRouter\);/, 'app.use("/api/game/memory-card", memoryCardRouter);');
code = code.replace(/app\.use\("\/game\/word-matching", wordMatchingRouter\);/, 'app.use("/api/game/word-matching", wordMatchingRouter);');

fs.writeFileSync('backend-api/src/app.ts', code);
