const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/course/[id].tsx', 'utf8');

code = code.replace(
  /\{ borderColor: cardBorder, borderWidth: cardBorder !== 'transparent' \? 1 : 1, borderColor: cardBorder !== 'transparent' \? cardBorder : '#f3f4f6' \}/g,
  `{ borderWidth: 1, borderColor: cardBorder !== 'transparent' ? cardBorder : '#f3f4f6' }`
);

fs.writeFileSync('mobile-english/src/app/(tabs)/course/[id].tsx', code);
