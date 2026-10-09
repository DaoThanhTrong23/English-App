const fs = require('fs');
const path = 'backend-api/src/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

const additionalModels = `
model PostLike {
  id        Int      @id @default(autoincrement())
  postId    Int      @map("post_id")
  userId    Int      @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("post_like")
}

model CommunityComment {
  id        Int      @id @default(autoincrement())
  postId    Int      @map("post_id")
  userId    Int      @map("user_id")
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("community_comment")
}
`;

if (!code.includes('model PostLike')) {
  // Add models at the end
  code += additionalModels;

  // Add relations to User
  code = code.replace(/communityPosts      CommunityPost\[\]/g, 'communityPosts      CommunityPost[]\n  postLikes           PostLike[]\n  communityComments   CommunityComment[]');

  // Add relations to CommunityPost
  code = code.replace(/user      User     @relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/g, 'user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  postLikes PostLike[]\n  comments  CommunityComment[]');

  fs.writeFileSync(path, code);
}
