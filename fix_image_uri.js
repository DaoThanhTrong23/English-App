const fs = require('fs');

const getFixedImageURI = (url) => {
  return url.startsWith('http') ? url : 'http://localhost:3000' + url;
}

const games = [
  'mobile-english/src/app/game/bubble-game.tsx',
  'mobile-english/src/app/game/memory-card.tsx',
  'mobile-english/src/app/game/word-matching.tsx'
];

for (const game of games) {
  if (fs.existsSync(game)) {
    let code = fs.readFileSync(game, 'utf8');
    
    // Replace hardcoded 'http://localhost:3000' + item.imageUrl
    code = code.replace(
      /uri:\s*'http:\/\/localhost:3000'\s*\+\s*([a-zA-Z0-9_\.]+)/g, 
      "uri: $1.startsWith('http') ? $1 : 'http://localhost:3000' + $1"
    );

    // Replace if there are any backtick templated versions like \`http://localhost:3000\${item.imageUrl}\`
    code = code.replace(
      /uri:\s*`http:\/\/localhost:3000\$\{([a-zA-Z0-9_\.]+)\}`/g, 
      "uri: $1.startsWith('http') ? $1 : 'http://localhost:3000' + $1"
    );

    fs.writeFileSync(game, code);
  }
}
