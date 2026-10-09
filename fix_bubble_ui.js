const fs = require('fs');

const file = 'mobile-english/src/app/game/bubble-game.tsx';
let code = fs.readFileSync(file, 'utf8');

// Thêm text hướng dẫn
code = code.replace(
  /<View style=\{styles\.timerBox\}>/g,
  '<Text style={{fontSize: 12, color: "#4b5563", fontStyle: "italic", marginLeft: 10}}>Chạm 1 Bóng Chữ & 1 Bóng Hình</Text>\n        <View style={styles.timerBox}>'
);

fs.writeFileSync(file, code);
