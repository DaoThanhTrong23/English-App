const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

if (!code.includes("setTimeout(resolve, 300)")) {
  code = code.replace(
    /const uri = recorder\.uri;/,
    `// Wait for iOS to flush the file to disk
    await new Promise(resolve => setTimeout(resolve, 300));
    const uri = recorder.uri;`
  );
  fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
}
