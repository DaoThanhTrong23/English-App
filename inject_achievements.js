const fs = require('fs');

const lessonServicePath = 'backend-api/src/module/student-lesson/student-lesson.service.ts';
let lessonCode = fs.readFileSync(lessonServicePath, 'utf8');

if (!lessonCode.includes('achievementEvaluator')) {
  lessonCode = `import { achievementEvaluator } from '../achievement/achievement.evaluator.js';\n` + lessonCode;
  lessonCode = lessonCode.replace(
    'return {\n      lessonId',
    '// Tự động quét thành tựu\n    await achievementEvaluator.evaluateUserAchievements(userId);\n\n    return {\n      lessonId'
  );
  fs.writeFileSync(lessonServicePath, lessonCode);
}

const testServicePath = 'backend-api/src/module/student-test/student-test.service.ts';
let testCode = fs.readFileSync(testServicePath, 'utf8');
if (!testCode.includes('achievementEvaluator')) {
  testCode = `import { achievementEvaluator } from '../achievement/achievement.evaluator.js';\n` + testCode;
  testCode = testCode.replace(
    'return {\n      totalScore',
    '// Tự động quét thành tựu\n    await achievementEvaluator.evaluateUserAchievements(userId);\n\n    return {\n      totalScore'
  );
  fs.writeFileSync(testServicePath, testCode);
}
