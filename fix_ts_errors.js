const fs = require('fs');

// 1. Fix profile.route.ts
const profileRoutePath = 'backend-api/src/module/auth/profile.route.ts';
let profileCode = fs.readFileSync(profileRoutePath, 'utf8');
profileCode = profileCode.replace(/asyncHandler\(async \(req, res\)/g, 'asyncHandler(async (req: any, res)');
profileCode = profileCode.replace(/status: 'learned'/g, "status: 'mastered'");
fs.writeFileSync(profileRoutePath, profileCode);

// 2. Fix notification.route.ts
const notifRoutePath = 'backend-api/src/module/notification/notification.route.ts';
let notifCode = fs.readFileSync(notifRoutePath, 'utf8');
notifCode = notifCode.replace(/asyncHandler\(async \(req, res\)/g, 'asyncHandler(async (req: any, res)');
fs.writeFileSync(notifRoutePath, notifCode);

// 3. Fix student-test.service.ts
const testServicePath = 'backend-api/src/module/student-test/student-test.service.ts';
let testCode = fs.readFileSync(testServicePath, 'utf8');
testCode = testCode.replace(/q\.questionType === 'true_false' \|\| /g, '');
testCode = testCode.replace(/q\.questionType === 'multiple_choice' \|\| q\.questionType === 'true_false'/g, "q.questionType === 'multiple_choice'");
fs.writeFileSync(testServicePath, testCode);
