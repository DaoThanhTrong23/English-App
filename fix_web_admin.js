const fs = require('fs');
let code = fs.readFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', 'utf8');

// 1. Update state definition
code = code.replace(
  /const \[testForm, setTestForm\] = useState\(\{ title: '', description: '', ceftLevel: '' \}\);/,
  `const [testForm, setTestForm] = useState({ title: '', description: '', ceftLevel: '', skillCategory: '' });`
);

// 2. Update reset after create
code = code.replace(
  /setTestForm\(\{ title: '', description: '', ceftLevel: '' \}\);/g,
  `setTestForm({ title: '', description: '', ceftLevel: '', skillCategory: '' });`
);

// 3. Update buttons by matching the React logic instead of exact title text
code = code.replace(
  /setTestForm\(\{\.\.\.testForm, title: '(B.i )?Luy.n Nghe'\}\);/g,
  `setTestForm({...testForm, title: 'Bài Luyện Nghe', skillCategory: 'listening'});`
);
code = code.replace(
  /setTestForm\(\{\.\.\.testForm, title: '(B.i )?Luy.n N.i'\}\);/g,
  `setTestForm({...testForm, title: 'Bài Luyện Nói', skillCategory: 'speaking'});`
);
code = code.replace(
  /setTestForm\(\{\.\.\.testForm, title: '(B.i )?Luy.n ...c'\}\);/g,
  `setTestForm({...testForm, title: 'Bài Luyện Đọc', skillCategory: 'reading'});`
);
code = code.replace(
  /setTestForm\(\{\.\.\.testForm, title: '(B.i )?Luy.n Vi.t'\}\);/g,
  `setTestForm({...testForm, title: 'Bài Luyện Viết', skillCategory: 'writing'});`
);

fs.writeFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', code);
