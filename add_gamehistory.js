const fs = require('fs');
let code = fs.readFileSync('backend-api/src/prisma/schema.prisma', 'utf8');

const newModel = `
model GameHistory {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  gameCode     String   @map("game_code") @db.VarChar(50)
  score        Int      @default(0)
  durationSec  Int      @default(0) @map("duration_sec")
  correctPairs Int      @default(0) @map("correct_pairs")
  totalPairs   Int      @default(0) @map("total_pairs")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("game_history")
}
`;

if (!code.includes("model GameHistory")) {
  code += newModel;
  fs.writeFileSync('backend-api/src/prisma/schema.prisma', code);
  console.log("Added GameHistory model.");
} else {
  console.log("GameHistory model already exists.");
}
