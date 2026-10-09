const fs = require('fs');
let code = fs.readFileSync('backend-api/src/prisma/schema.prisma', 'utf8');

if (!code.includes('userAnswer  String?')) {
  code = code.replace(
    /timeTakenMs Int      @map\("time_taken_ms"\)/,
    `timeTakenMs Int      @map("time_taken_ms")\n  userAnswer  String?  @db.Text @map("user_answer")`
  );
  fs.writeFileSync('backend-api/src/prisma/schema.prisma', code);
}
