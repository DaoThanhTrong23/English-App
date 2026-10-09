const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');

if (!code.includes("'mario'")) {
  code = code.replace(
    /\{ id: 'word-matching', name: 'Nối Từ Tuyệt Đỉnh', icon: 'git-network', color: '#10b981', desc: 'Ghép cặp từ và nghĩa' \}/,
    `{ id: 'word-matching', name: 'Nối Từ Tuyệt Đỉnh', icon: 'git-network', color: '#10b981', desc: 'Ghép cặp từ và nghĩa' },
    { id: 'mario', name: 'Mario Phóng Thoát', icon: 'mic', color: '#ef4444', desc: 'Đọc to tiếng Anh để vượt chướng ngại vật' }`
  );
  fs.writeFileSync('mobile-english/src/app/games.tsx', code);
}
