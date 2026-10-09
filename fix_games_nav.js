const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');

// Thay thế onPress cứng thành router.push
code = code.replace(/onPress=\{\(\) => \{ \/\* Navigate to specific game if built \*\/ \}\}/g, "onPress={() => router.push(`/game/${game.id}`)}");

fs.writeFileSync('mobile-english/src/app/games.tsx', code);
