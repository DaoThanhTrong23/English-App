const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', 'utf8');

// 1. Add useFocusEffect, useCallback
if (!code.includes('useFocusEffect')) {
  code = code.replace(
    /import \{ useLocalSearchParams, useRouter \} from 'expo-router';/,
    "import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';\nimport { useCallback } from 'react';"
  );
}

// 2. Change useEffect to useFocusEffect
code = code.replace(
  /useEffect\(\(\) => \{\n\s*fetchLessonDetail\(\);\n\s*\}, \[id\]\);/,
  "useFocusEffect(useCallback(() => { fetchLessonDetail(); }, [id]));"
);

// 3. Add getSkillProgress function
const getSkillProgressFn = `
  const getSkillProgress = (skillType: string) => {
    if (!lesson || !lesson.tests) return 0;
    const test = lesson.tests.find((t: any) => t.title.toLowerCase().includes(skillType));
    if (test && test.userResult?.bestScore != null) {
      const totalPossible = (test.totalQuestions || 0) * 10;
      if (totalPossible === 0) return 0;
      return Math.min(100, Math.round((test.userResult.bestScore / totalPossible) * 100));
    }
    return 0;
  };
`;
if (!code.includes('const getSkillProgress')) {
  code = code.replace(
    /const navigateToPractice = \(skillType: string\) => \{/,
    getSkillProgressFn + "\n  const navigateToPractice = (skillType: string) => {"
  );
}

// 4. Update the hardcoded progressPct with dynamic ones
code = code.replace(
  /<Text style=\{\[styles\.skillPercent, \{ color: '#3b82f6' \}\]\}>\{progressPct\}%<\/Text>/g,
  (match, offset, str) => {
    // Determine the skillType based on the preceding text
    let skillType = 'test';
    const precedingText = str.substring(Math.max(0, offset - 200), offset);
    if (precedingText.includes("navigateToPractice('listening')")) skillType = 'listening';
    else if (precedingText.includes("navigateToPractice('reading')")) skillType = 'reading';
    else if (precedingText.includes("navigateToPractice('writing')")) skillType = 'writing';
    else if (precedingText.includes("navigateToPractice('speaking')")) skillType = 'speaking';
    
    return `<Text style={[styles.skillPercent, { color: '#3b82f6' }]}>{getSkillProgress('${skillType}')}%</Text>`;
  }
);

// 5. Compute completedSkills properly
code = code.replace(
  /const completedSkills = isCompleted \? 5 : 0;/,
  `
  const completedSkills = ['listening', 'reading', 'writing', 'speaking', 'test']
    .filter(type => getSkillProgress(type) > 0).length;
  `
);

fs.writeFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', code);
