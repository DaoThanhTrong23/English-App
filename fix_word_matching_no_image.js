const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/word-matching.tsx', 'utf8');

// Replace the renderColumnBItem logic to only show text
const renderB_regex = /\{item\.imageUrl \? \([\s\S]*?\) : \([\s\S]*?<Text style=\{\[styles\.cardText, isConnected && styles\.textConnected\]\}>\{item\.meaning\}<\/Text>\s*\)\}/;

code = code.replace(renderB_regex, '<Text style={[styles.cardText, isConnected && styles.textConnected]}>{item.meaning}</Text>');

fs.writeFileSync('mobile-english/src/app/game/word-matching.tsx', code);
