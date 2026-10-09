const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');

code = code.replace(/onPress=\{\(\) => router\.push\(`\/game\/\$\{game\.id\}`\)\}/g, "onPress={() => { /* @ts-ignore */ router.push(`/game/${game.id}`) }}");

fs.writeFileSync('mobile-english/src/app/games.tsx', code);
