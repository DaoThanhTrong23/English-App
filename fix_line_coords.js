const fs = require('fs');

let code = fs.readFileSync('mobile-english/src/app/game/word-matching.tsx', 'utf8');

code = code.replace(
  /const startY = 35 \+ layoutA\.y \+ layoutA\.height \/ 2; \/\/ \+35 for "Ting Anh" title text height/g,
  'const startY = layoutA.y + layoutA.height / 2;'
);

code = code.replace(
  /const startY = 35 \+ layoutA\.y \+ layoutA\.height \/ 2; \/\/ \+35 for "Tiếng Anh" title text height/g,
  'const startY = layoutA.y + layoutA.height / 2;'
);

code = code.replace(
  /const endY = 35 \+ layoutB\.y \+ layoutB\.height \/ 2;/g,
  'const endY = layoutB.y + layoutB.height / 2;'
);

fs.writeFileSync('mobile-english/src/app/game/word-matching.tsx', code);
