const fs = require('fs');
let code = fs.readFileSync('backend-api/seed_courses.ts', 'utf8');

code = code.replace(
  /import \{ PrismaClient \} from '@prisma\/client';\s*const prisma = new PrismaClient\(\);/,
  `import { prisma } from './src/config/prisma.js';`
);

fs.writeFileSync('backend-api/seed_courses.ts', code);
