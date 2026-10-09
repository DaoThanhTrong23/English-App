const fs = require('fs');
const file = 'backend-api/src/module/student-vocabulary/student-vocabulary.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/this\.repo\.prisma\./g, 'prisma.');

if (!code.includes('import { prisma }')) {
  code = "import { prisma } from '../../config/prisma.js';\n" + code;
}

fs.writeFileSync(file, code);
