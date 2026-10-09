const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /const pScore = responseData\?\.data\?\.pronunciationScore \|\| 0;/,
  `const pScore = responseData?.data?.overallScore || 0;`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
