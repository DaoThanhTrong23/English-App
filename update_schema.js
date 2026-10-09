const fs = require('fs');
let code = fs.readFileSync('backend-api/src/prisma/schema.prisma', 'utf8');

if (!code.includes('skillCategory String?')) {
  code = code.replace(
    /ceftLevel   String\? @map\("ceft_level"\) @db\.VarChar\(10\)/,
    `ceftLevel   String? @map("ceft_level") @db.VarChar(10)\n  skillCategory String? @map("skill_category") @db.VarChar(50)`
  );
  fs.writeFileSync('backend-api/src/prisma/schema.prisma', code);
}
