const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.router.ts', 'utf8');

if (!code.includes("Buffer length:")) {
  code = code.replace(
    /const result = await aiService\.evaluatePronunciationGOP\(/,
    `console.log("Received audio buffer of length:", uploadedFile.buffer.length);
    const result = await aiService.evaluatePronunciationGOP(`
  );
  fs.writeFileSync('backend-api/src/module/AI/ai.router.ts', code);
}
