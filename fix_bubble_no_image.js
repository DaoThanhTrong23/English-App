const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/bubble-game.tsx', 'utf8');

// Replace the bubble content rendering
const bubbleContentRegex = /\{type === 'word' \? \([\s\S]*?\) : \([\s\S]*?item\.imageUrl \? \([\s\S]*?\) : \([\s\S]*?<Text style=\{styles\.bubbleTextMeaning\}>\{item\.meaning\}<\/Text>\s*\)\s*\)\}/;

code = code.replace(bubbleContentRegex, 
`{type === 'word' ? (
          <Text style={styles.bubbleText}>{item.word}</Text>
        ) : (
          <Text style={styles.bubbleTextMeaning}>{item.meaning}</Text>
        )}`);

fs.writeFileSync('mobile-english/src/app/game/bubble-game.tsx', code);
