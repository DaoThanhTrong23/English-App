const fs = require('fs');
let code = fs.readFileSync('backend-api/src/prisma/schema.prisma', 'utf8');

// Undo the wrong replace
code = code.replace(/  gameHistories GameHistory\[\]\n/g, '');

// Specifically add it to User
const userModelStart = code.indexOf('model User {');
const userModelEnd = code.indexOf('@@map("users")', userModelStart);
const before = code.substring(0, userModelEnd);
const after = code.substring(userModelEnd);

code = before + '  gameHistories GameHistory[]\n\n  ' + after;

fs.writeFileSync('backend-api/src/prisma/schema.prisma', code);
