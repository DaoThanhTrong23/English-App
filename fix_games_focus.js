const fs = require('fs');

let code = fs.readFileSync('mobile-english/src/app/games.tsx', 'utf8');

// 1. Add useFocusEffect and useCallback to imports
if (!code.includes('useFocusEffect')) {
  code = code.replace(
    "import { useRouter } from 'expo-router';",
    "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useCallback } from 'react';"
  );
}

// 2. Replace useEffect with useFocusEffect
if (code.includes('useEffect(() => {') && !code.includes('useFocusEffect(useCallback')) {
  code = code.replace(
    /useEffect\(\(\) => \{\n\s*fetchStats\(\);\n\s*\}, \[\]\);/,
    `useFocusEffect(\n    useCallback(() => {\n      fetchStats();\n    }, [])\n  );`
  );
}

fs.writeFileSync('mobile-english/src/app/games.tsx', code);
