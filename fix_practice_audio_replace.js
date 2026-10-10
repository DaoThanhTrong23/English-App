const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /player\.replace\(audioSource\);\n\s*player\.play\(\);/g,
  "player.play();"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
