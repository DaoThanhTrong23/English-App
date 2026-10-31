import { PrismaClient } from '../generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function insertInChunks<T>(
  modelDelegate: any,
  name: string,
  items: T[],
  chunkSize = 1000
) {
  if (!items || items.length === 0) return;
  console.log(`⏳ Đang chèn ${items.length} bản ghi vào ${name}...`);
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await modelDelegate.createMany({ data: chunk, skipDuplicates: true });
  }
  console.log(`✅ Đã hoàn tất ${name}`);
}

async function main() {
  console.log('🌱 Bắt đầu quá trình seed dữ liệu hệ thống (Full System Restore)...');

  const dataPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Không tìm thấy file seed-data.json!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  try {
    // Tắt kiểm tra khóa ngoại để chèn dữ liệu không bị xung đột thứ tự quan hệ
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Roles & Permissions
    await insertInChunks(prisma.role, 'Roles', data.roles);
    await insertInChunks(prisma.permission, 'Permissions', data.permissions);

    // Mối quan hệ n-n giữa Permission và Role (_PermissionToRole)
    if (data.permissionToRole && data.permissionToRole.length > 0) {
      console.log(`⏳ Đang liên kết ${data.permissionToRole.length} quyền cho các vai trò (_permissiontorole)...`);
      const chunkSize = 200;
      for (let i = 0; i < data.permissionToRole.length; i += chunkSize) {
        const chunk = data.permissionToRole.slice(i, i + chunkSize);
        const values = chunk
          .map((r: any) => `(${Number(r.permissionId)}, ${Number(r.roleId)})`)
          .join(', ');
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO _permissiontorole (A, B) VALUES ${values};`
        );
      }
      console.log('✅ Đã hoàn tất liên kết quyền _permissiontorole');
    }

    // 2. Users (Bao gồm admin, giáo viên và học viên)
    await insertInChunks(prisma.user, 'Users', data.users, 500);

    // 3. Topics, Lessons, Words & LessonWords
    await insertInChunks(prisma.topic, 'Topics', data.topics);
    await insertInChunks(prisma.lesson, 'Lessons', data.lessons);
    await insertInChunks(prisma.word, 'Words', data.words, 1000);
    await insertInChunks(prisma.lessonWord, 'LessonWords', data.lessonWords, 500);

    // 4. Tests, Questions & Answers (Đầy đủ 4 kỹ năng Nghe/Nói/Đọc/Viết)
    await insertInChunks(prisma.test, 'Tests', data.tests, 500);
    await insertInChunks(prisma.question, 'Questions', data.questions, 500);
    await insertInChunks(prisma.answer, 'Answers', data.answers, 500);

    // 5. Games & GameSettings & GameHistories
    await insertInChunks(prisma.game, 'Games', data.games);
    await insertInChunks(prisma.gameSetting, 'GameSettings', data.gameSettings);
    await insertInChunks(prisma.gameHistory, 'GameHistories', data.gameHistories, 500);

    // 6. Achievements & UserAchievements
    await insertInChunks(prisma.achievement, 'Achievements', data.achievements);
    await insertInChunks(prisma.userAchievement, 'UserAchievements', data.userAchievements, 500);

    // 7. Học tập cá nhân (Progress, Results, Assessment History)
    await insertInChunks(prisma.userProgress, 'UserProgress', data.userProgress, 500);
    await insertInChunks(prisma.userTestResult, 'UserTestResults', data.userTestResults, 500);
    await insertInChunks(prisma.assessmentHistory, 'AssessmentHistories', data.assessmentHistories, 500);

    // 8. Cộng đồng & Thông báo (Posts, Comments, Likes, Notifications)
    await insertInChunks(prisma.communityPost, 'CommunityPosts', data.communityPosts);
    await insertInChunks(prisma.postImage, 'PostImages', data.postImages);
    await insertInChunks(prisma.communityComment, 'CommunityComments', data.communityComments);
    await insertInChunks(prisma.postLike, 'PostLikes', data.postLikes);
    await insertInChunks(prisma.notification, 'Notifications', data.notifications, 500);

    console.log('\n🎉 Chúc mừng! Đã nạp thành công toàn bộ dữ liệu vào cơ sở dữ liệu!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    await prisma.$disconnect();
  }
}

main();
