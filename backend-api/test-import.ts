import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TEST: GÁN TỪ VỰNG TỪ POOL & TẠO 4 BÀI TEST KỸ NĂNG ---');

  // 1. Tìm Lesson vừa tạo (Bài 1: Phỏng vấn xin việc)
  const lesson = await prisma.lesson.findFirst({
    where: { title: { contains: 'Phỏng vấn xin việc' } }
  });

  if (!lesson) {
    console.log('Không tìm thấy bài học mẫu!');
    return;
  }
  console.log('Đã tìm thấy bài học: ', lesson.title);

  // 2. Tìm một số từ vựng ngẫu nhiên trong DB chưa thuộc bài học này
  const wordsToImport = await prisma.word.findMany({
    where: {
      lessonWords: {
        none: { lessonId: lesson.id }
      }
    },
    take: 3
  });

  if (wordsToImport.length > 0) {
    console.log('Đang import các từ vựng có sẵn vào bài học:', wordsToImport.map(w => w.headword).join(', '));
    // Gắn vào bảng trung gian LessonWord
    for (const w of wordsToImport) {
      await prisma.lessonWord.create({
        data: {
          lessonId: lesson.id,
          wordId: w.id
        }
      });
    }
    console.log('✅ Đã gán từ vựng thành công!');
  } else {
    console.log('Không có từ vựng nào trống trong DB để gán thêm.');
  }

  // 3. Tạo 4 bài test kỹ năng cho bài học này
  console.log('Đang tạo 4 bài test: Nghe, Nói, Đọc, Viết...');
  const testTitles = ['Bài Luyện Nghe', 'Bài Luyện Nói', 'Bài Luyện Đọc', 'Bài Luyện Viết'];
  
  for (const title of testTitles) {
    // Kiểm tra xem đã có chưa
    const existing = await prisma.test.findFirst({
      where: { title: { startsWith: title }, lessonId: lesson.id }
    });
    if (!existing) {
      await prisma.test.create({
        data: {
          title: title + ' - ' + lesson.title,
          description: 'Bài kiểm tra kỹ năng ' + title.replace('Bài Luyện ', '') + ' cho bài học.',
          ceftLevel: lesson.cefrLevel,
          lessonId: lesson.id
        }
      });
      console.log('✅ Đã tạo: ' + title);
    } else {
      console.log('⚠️ ' + title + ' đã tồn tại.');
    }
  }

  console.log('--- TEST HOÀN TẤT ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
