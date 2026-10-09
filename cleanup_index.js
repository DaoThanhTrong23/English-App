const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/index.tsx', 'utf8');

// Remove unused state
code = code.replace(/const \[selectedCourse, setSelectedCourse\] = useState<any>\(null\);\s*/, '');
code = code.replace(/const \[lessons, setLessons\] = useState<any\[\]>\(\[\]\);\s*/, '');

// Remove fetchLessons function block
code = code.replace(/const fetchLessons = async.*?};\s*/s, '');

// Remove the leftover `fetchLessons(firstCourse.id)`
code = code.replace(/setSelectedCourse\(firstCourse\);\s*fetchLessons\(firstCourse\.id\);/, '');

fs.writeFileSync('mobile-english/src/app/(tabs)/index.tsx', code);
