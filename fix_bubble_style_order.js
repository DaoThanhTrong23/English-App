const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/bubble-game.tsx', 'utf8');

code = code.replace(
  /style=\s*\{\[\s*styles\.bubble,\s*isSelected && styles\.bubbleSelected,\s*type === 'word' \? styles\.bubbleWord : styles\.bubbleMeaning\s*\]\}/,
  `style={[
            styles.bubble, 
            type === 'word' ? styles.bubbleWord : styles.bubbleMeaning,
            isSelected && styles.bubbleSelected
          ]}`
);

fs.writeFileSync('mobile-english/src/app/game/bubble-game.tsx', code);
