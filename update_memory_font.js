const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/memory-card.tsx', 'utf8');

code = code.replace(
  /cardText: \{ fontSize: 16, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' \},/,
  "cardText: { fontSize: 13, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },"
);

code = code.replace(
  /cardTextMeaning: \{ fontSize: 14, fontWeight: 'bold', color: '#047857', textAlign: 'center' \},/,
  "cardTextMeaning: { fontSize: 11, fontWeight: 'bold', color: '#047857', textAlign: 'center' },"
);

fs.writeFileSync('mobile-english/src/app/game/memory-card.tsx', code);
