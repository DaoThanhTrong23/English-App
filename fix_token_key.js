const fs = require('fs');
let code1 = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');
code1 = code1.replace(
  /SecureStore\.getItemAsync\('token'\)/g,
  "SecureStore.getItemAsync('accessToken')"
);
fs.writeFileSync('mobile-english/src/app/practice.tsx', code1);

let code2 = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');
code2 = code2.replace(
  /SecureStore\.getItemAsync\('token'\)/g,
  "SecureStore.getItemAsync('accessToken')"
);
fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code2);
