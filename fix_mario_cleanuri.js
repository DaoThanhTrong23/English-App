const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Revert cleanUri back to uri
code = code.replace(
  /const cleanUri = Platform\.OS === 'ios' \? uri\.replace\('file:\/\/', ''\) : uri;[\s\S]*?uri: cleanUri,/m,
  `// Pass the exact uri which includes file://
      const cleanUri = uri;
      formData.append('audio', {
        uri: cleanUri,`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
