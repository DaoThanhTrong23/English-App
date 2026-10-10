const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /correctPairs: score \/ 10,/,
  'correctPairs: Math.floor(score / 10),'
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
