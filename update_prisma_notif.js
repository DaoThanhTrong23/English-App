const fs = require('fs');
const path = 'backend-api/src/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

const notifModel = `
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  title     String   @db.VarChar(255)
  body      String   @db.Text
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId], map: "user_id")
  @@map("notification")
}
`;

if (!code.includes('model Notification')) {
  code += notifModel;
  code = code.replace(/assessmentHistories AssessmentHistory\[\]/g, 'assessmentHistories AssessmentHistory[]\n  notifications       Notification[]');
  fs.writeFileSync(path, code);
}
