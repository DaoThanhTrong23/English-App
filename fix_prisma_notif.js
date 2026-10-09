const fs = require('fs');
const path = 'backend-api/src/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

// Loại bỏ 'notifications Notification[]' khỏi Question
code = code.replace(/model Question \{[\s\S]*?\}/, match => match.replace(/\s*notifications\s*Notification\[\]/, ''));

fs.writeFileSync(path, code);
