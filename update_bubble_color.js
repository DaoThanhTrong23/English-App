const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/bubble-game.tsx', 'utf8');

code = code.replace(
  /bubbleSelected: \{ borderWidth: 4, borderColor: '#ef4444', transform: \[\{ scale: 1\.1 \}\] \},/g,
  "bubbleSelected: { borderWidth: 4, borderColor: '#22c55e', transform: [{ scale: 1.1 }] },"
);

fs.writeFileSync('mobile-english/src/app/game/bubble-game.tsx', code);
