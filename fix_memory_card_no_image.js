const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/memory-card.tsx', 'utf8');

// Replace renderCardContent logic to only show text
const renderCardContentFunc = `  const renderCardContent = (card: any) => {
    if (card.type === 'word') {
      return <Text style={styles.cardText}>{card.content}</Text>;
    } else {
      return <Text style={styles.cardTextMeaning}>{card.content}</Text>;
    }
  };`;

code = code.replace(/const renderCardContent = \([\s\S]*?\}\s*\n\s*\};/, renderCardContentFunc);

fs.writeFileSync('mobile-english/src/app/game/memory-card.tsx', code);
