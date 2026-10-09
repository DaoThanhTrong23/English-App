const fs = require('fs');

const games = [
  'mobile-english/src/app/game/bubble-game.tsx',
  'mobile-english/src/app/game/memory-card.tsx',
  'mobile-english/src/app/game/word-matching.tsx'
];

for (const game of games) {
  if (fs.existsSync(game)) {
    let code = fs.readFileSync(game, 'utf8');
    
    // Add import { API_URL } if not exists
    if (!code.includes('import { API_URL }')) {
      code = code.replace(/import \{ axiosClient \}.*;/, "import { axiosClient } from '../../api/axiosClient';\nimport { API_URL } from '../../constants/api';");
    }

    // Replace getFixedImageURI or add it
    const fixedFunc = `
const getFixedImageURI = (url: string) => {
  if (!url) return null;
  const BASE_URL = API_URL.replace('/api', '');
  return url.startsWith('http') ? url : BASE_URL + (url.startsWith('/') ? '' : '/') + url;
};
`;

    if (code.includes('const getFixedImageURI =')) {
      code = code.replace(/const getFixedImageURI = \([^\}]+\};/g, fixedFunc.trim());
    } else {
      code = code.replace(/export default function/, fixedFunc.trim() + "\n\nexport default function");
      // And also replace all hardcoded localhost in the file
      code = code.replace(/'http:\/\/localhost:3000' \+ [a-zA-Z0-9_\.]+/g, "getFixedImageURI($&)");
    }
    
    // In memory-card and word-matching, they didn't have getFixedImageURI defined, they had it inline
    code = code.replace(/uri: 'http:\/\/localhost:3000' \+ (card\.imageUrl|item\.imageUrl)/g, "uri: getFixedImageURI($1) || ''");
    
    // Specific cleanup for memory-card and word-matching since they might have inline:
    // "uri: card.imageUrl.startsWith('http') ? card.imageUrl : 'http://localhost:3000' + card.imageUrl"
    code = code.replace(/uri: ([a-zA-Z0-9_\.]+)\.imageUrl\.startsWith\('http'\)[^,]+/, "uri: getFixedImageURI($1.imageUrl) || ''");

    fs.writeFileSync(game, code);
  }
}
