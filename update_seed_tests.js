const fs = require('fs');
let code = fs.readFileSync('backend-api/seed_tests.ts', 'utf8');

// Add skillCategory to readTest
code = code.replace(
  /title: \`Bài Luyện Đọc\`,/,
  `title: \`Bài Luyện Đọc\`,\n        skillCategory: 'reading',`
);

// Add skillCategory to listenTest
code = code.replace(
  /title: \`Bài Luyện Nghe\`,/,
  `title: \`Bài Luyện Nghe\`,\n        skillCategory: 'listening',`
);

// Update dummy audio to real URL for listening question
code = code.replace(
  /audioUrl: 'https:\/\/example\.com\/sample-audio\.mp3',/,
  `audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',`
);

// Add skillCategory to speakTest
code = code.replace(
  /title: \`Bài Luyện Nói\`,/,
  `title: \`Bài Luyện Nói\`,\n        skillCategory: 'speaking',`
);

// Add skillCategory to writeTest
code = code.replace(
  /title: \`Bài Luyện Viết\`,/,
  `title: \`Bài Luyện Viết\`,\n        skillCategory: 'writing',`
);

fs.writeFileSync('backend-api/seed_tests.ts', code);
