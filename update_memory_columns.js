const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/memory-card.tsx', 'utf8');

code = code.replace(
  /const CARD_SIZE = \(width - 40\) \/ 3 - CARD_MARGIN \* 2;/,
  'const CARD_SIZE = (width - 40) / 4 - CARD_MARGIN * 2;'
);

fs.writeFileSync('mobile-english/src/app/game/memory-card.tsx', code);
