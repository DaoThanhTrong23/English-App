const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');

code = code.replace(
  /\/\* @ts-ignore \*\/ router\.push\(\`\/game\/\$\{game\.id\}\`\)/g,
  `router.push(\`/game/\${game.id}\` as any)`
);

fs.writeFileSync('mobile-english/src/app/games.tsx', code);
