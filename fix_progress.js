const fs = require('fs');
const file = 'backend-api/src/module/student-lesson/student-lesson.service.ts';
let code = fs.readFileSync(file, 'utf8');

const oldComplete = `async completeLesson(userId: number, lessonId: number) {
    const lesson = await this.studentLessonRepo.findLessonDetailById(lessonId);`;

const newComplete = `async completeLesson(userId: number, lessonId: number) {
    const lesson = await this.studentLessonRepo.findLessonDetailById(lessonId);
    if (lesson) {
      const wordIds = lesson.lessonWords.map(lw => lw.wordId);
      for (const wId of wordIds) {
        await prisma.userProgress.upsert({
          where: { unique_user_word: { userId, wordId: wId } },
          update: { memoryLevel: { increment: 1 }, status: 'learning' },
          create: { userId, wordId: wId, status: 'learning', memoryLevel: 1 }
        });
      }
    }`;

code = code.replace(oldComplete, newComplete);
fs.writeFileSync(file, code);
