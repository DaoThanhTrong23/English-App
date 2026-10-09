const fs = require('fs');
const file = 'mobile-english/src/app/game/memory-card.tsx';
let code = fs.readFileSync(file, 'utf8');

// Thay đổi CARD_SIZE và CSS để grid tự căn 3-4 cột đẹp mắt
code = code.replace(
  /const CARD_MARGIN = 10;\s*const CARD_SIZE = \(width - CARD_MARGIN \* 6\) \/ 3;/,
  `const CARD_MARGIN = 6;
const CARD_SIZE = (width - 40) / 3 - CARD_MARGIN * 2;`
);

code = code.replace(
  /grid: \{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 \},/,
  `grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', padding: 10 },`
);

code = code.replace(
  /height: CARD_SIZE \* 1\.2,/,
  `height: CARD_SIZE * 1.4,`
);

fs.writeFileSync(file, code);
