const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /const audioSource = currentQ\?\.audioUrl \? \(currentQ\.audioUrl\.startsWith\('http'\) \? currentQ\.audioUrl : \`\\\$\\{API_URL\\}\\\$\\{currentQ\.audioUrl\\}\`\) : '';/,
  "const audioSource = currentQ?.audioUrl ? (currentQ.audioUrl.startsWith('http') ? currentQ.audioUrl : `${API_URL.replace('/api', '')}${currentQ.audioUrl}`) : '';"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
