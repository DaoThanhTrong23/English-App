const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /const OBSTACLES = \[\s*\{ name: 'bug', color: '#ef4444' \},\s*\{ name: 'flame', color: '#f97316' \},\s*\{ name: 'skull', color: '#4b5563' \},\s*\{ name: 'bonfire', color: '#ea580c' \},\s*\{ name: 'flash', color: '#eab308' \},\s*\];/,
  `const OBSTACLES = [
  { name: 'flame', color: '#f97316' },
  { name: 'bug', color: '#ef4444' }
];`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
