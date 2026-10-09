const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');
code = code.replace(/onPress=\{[^}]*\}\s*>\s*<View style=\{\[styles\.iconBox/, "onPress={() => router.push(`/game/${game.id}`)}>\n            <View style={[styles.iconBox");
fs.writeFileSync('mobile-english/src/app/games.tsx', code);
