const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /const cleanUri = uri;\s*const formData = new FormData\(\);/,
  `const cleanUri = uri;
      const currentWord = words[currentIndex];
      const formData = new FormData();`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
