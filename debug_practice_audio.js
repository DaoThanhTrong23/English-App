const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /const playDummyAudio = async \(\) => \{/g,
  `const playDummyAudio = async () => {\n    console.log("Playing audioSource:", audioSource);\n    console.log("Player status:", player.status);`
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
