const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// Combine multiple_choice and listening
code = code.replace(
  /if \(q\.questionType === 'multiple_choice'\) \{/,
  "if (q.questionType === 'multiple_choice' || q.questionType === 'listening') {"
);

// Add audio button check for questionType === 'listening'
code = code.replace(
  /\{\(type === 'listening' \|\| q\.audioUrl\) && \(/,
  "{(type === 'listening' || q.audioUrl || q.questionType === 'listening') && ("
);

// Combine writing and fill_in_blank
code = code.replace(
  /if \(q\.questionType === 'writing'\) \{/,
  "if (q.questionType === 'writing' || q.questionType === 'fill_in_blank') {"
);

// Delete the old listening block
code = code.replace(
  /\/\/ 2\. Luy.n Nghe\s*if \(q\.questionType === 'listening'\) \{[\s\S]*?\}\s*\/\/ 3\. Luy.n NA3i/m,
  "// 3. Luyện Nói"
);
// Fallback for character encoding
code = code.replace(
  /\/\/ 2\. Luy.n Nghe\s*if \(q\.questionType === 'listening'\) \{[\s\S]*?\}\s*\/\/ 3\. Luy.n N.i/m,
  "// 3. Luyện Nói"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
