const fs = require('fs');
const file = 'mobile-english/src/app/game/memory-card.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add a dummy comment to force Metro to recompile the file cleanly
code = code.replace(/export default function MemoryCardScreen\(\) \{/, '// Force Metro Rebuild\nexport default function MemoryCardScreen() {');

fs.writeFileSync(file, code);
