import { PrismaClient } from '../src/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang trích xuất toàn bộ dữ liệu từ database sang src/prisma/seed-data.json...');

  // 1. Roles & Permissions
  const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
  const permissions = await prisma.permission.findMany({ orderBy: { id: 'asc' } });
  const permissionToRoleRaw = await prisma.$queryRawUnsafe('SELECT A, B FROM _permissiontorole');
  const permissionToRole = (permissionToRoleRaw as any[]).map(r => ({
    permissionId: Number(r.A),
    roleId: Number(r.B)
  }));

  // 2. Users
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

  // 3. Topics & Lessons & Words
  const topics = await prisma.topic.findMany({ orderBy: { id: 'asc' } });
  const lessons = await prisma.lesson.findMany({ orderBy: { id: 'asc' } });
  const words = await prisma.word.findMany({ orderBy: { id: 'asc' } });
  const lessonWords = await prisma.lessonWord.findMany({
    orderBy: [{ lessonId: 'asc' }, { wordId: 'asc' }]
  });

  // 4. Tests, Questions, Answers
  const tests = await prisma.test.findMany({ orderBy: { id: 'asc' } });
  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const answers = await prisma.answer.findMany({ orderBy: { id: 'asc' } });

  // 5. Games & Settings & History
  const games = await prisma.game.findMany({ orderBy: { id: 'asc' } });
  const gameSettings = await prisma.gameSetting.findMany({ orderBy: { id: 'asc' } });
  const gameHistories = await prisma.gameHistory.findMany({ orderBy: { id: 'asc' } });

  // 6. Achievements
  const achievements = await prisma.achievement.findMany({ orderBy: { id: 'asc' } });
  const userAchievements = await prisma.userAchievement.findMany({
    orderBy: [{ userId: 'asc' }, { achievementId: 'asc' }]
  });

  // 7. Progress & Results & History
  const userProgress = await prisma.userProgress.findMany({ orderBy: { id: 'asc' } });
  const userTestResults = await prisma.userTestResult.findMany({ orderBy: { id: 'asc' } });
  const assessmentHistories = await prisma.assessmentHistory.findMany({ orderBy: { id: 'asc' } });

  // 8. Community & Notifications
  const communityPosts = await prisma.communityPost.findMany({ orderBy: { id: 'asc' } });
  const postImages = await prisma.postImage.findMany({ orderBy: { id: 'asc' } });
  const communityComments = await prisma.communityComment.findMany({ orderBy: { id: 'asc' } });
  const postLikes = await prisma.postLike.findMany({
    orderBy: [{ userId: 'asc' }, { postId: 'asc' }]
  });
  const notifications = await prisma.notification.findMany({ orderBy: { id: 'asc' } });

  const exportPayload = {
    roles,
    permissions,
    permissionToRole,
    users,
    topics,
    lessons,
    words,
    lessonWords,
    tests,
    questions,
    answers,
    games,
    gameSettings,
    gameHistories,
    achievements,
    userAchievements,
    userProgress,
    userTestResults,
    assessmentHistories,
    communityPosts,
    postImages,
    communityComments,
    postLikes,
    notifications
  };

  const outputPath = path.join(__dirname, '..', 'src', 'prisma', 'seed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportPayload, null, 2), 'utf8');

  const stats = fs.statSync(outputPath);
  console.log(`\n✅ Đã ghi thành công ${stats.size} bytes vào ${outputPath}`);
  console.log('\nThống kê dữ liệu đã xuất:');
  for (const [key, val] of Object.entries(exportPayload)) {
    console.log(`- ${key.padEnd(20)}: ${(val as any[]).length} records`);
  }
}

main()
  .catch(err => {
    console.error('❌ Lỗi khi xuất dữ liệu:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
