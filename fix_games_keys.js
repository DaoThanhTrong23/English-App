const fs = require('fs');

const f1 = 'mobile-english/src/app/game/bubble-game.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/key=\{\\?`word-\\\$\\{w\.id\\}\\?`\}/g, 'key={"word-" + w.id}');
c1 = c1.replace(/key=\{\\?`meaning-\\\$\\{m\.id\\}\\?`\}/g, 'key={"meaning-" + m.id}');
// In case it's something like key={\`word-\${w.id}\`}
c1 = c1.replace(/key=\{\\`word-\\\$\{w\.id\}\\`\}/g, 'key={"word-" + w.id}');
c1 = c1.replace(/key=\{\\`meaning-\\\$\{m\.id\}\\`\}/g, 'key={"meaning-" + m.id}');
// Generic string replace for all backtick keys
c1 = c1.replace(/key=\{\\?`([^`]+)\\?`\}/g, 'key={"$1"}'); // Fallback
fs.writeFileSync(f1, c1);

const f2 = 'mobile-english/src/app/game/word-matching.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/key=\{\\?`A-\\\$\\{item\.id\\}\\?`\}/g, 'key={"A-" + item.id}');
c2 = c2.replace(/key=\{\\?`B-\\\$\\{item\.id\\}\\?`\}/g, 'key={"B-" + item.id}');
// Generic string replace for word-matching
c2 = c2.replace(/key=\{\\`A-\\\$\{item\.id\}\\`\}/g, 'key={"A-" + item.id}');
c2 = c2.replace(/key=\{\\`B-\\\$\{item\.id\}\\`\}/g, 'key={"B-" + item.id}');
fs.writeFileSync(f2, c2);
