const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/index.tsx', 'utf8');

// Remove references to isActive
code = code.replace(/, isActive && \{color: '#2563eb'\}/g, '');
code = code.replace(/isActive && \{borderColor: '#3b82f6', backgroundColor: '#f0fdfa'\}/g, 'null');
// or just clean up the array
code = code.replace(/\[styles\.topicCard, null\]/g, 'styles.topicCard');

fs.writeFileSync('mobile-english/src/app/(tabs)/index.tsx', code);
