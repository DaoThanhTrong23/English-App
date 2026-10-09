const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /const cleanUri = uri;\s*formData\.append\('audio', \{/,
  `const cleanUri = uri;
      const formData = new FormData();
      formData.append('audio', {`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
