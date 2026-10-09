const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /import \* as FileSystem from 'expo-file-system';/,
  "import * as FileSystem from 'expo-file-system/legacy';"
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
