const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', 'utf8');

const getSkillProgressCode = `
    const getSkillProgress = (skillType: string) => {
      if (!lesson || !lesson.tests) return 0;
      
      const keywordMap: Record<string, string[]> = {
        'listening': ['nghe', 'listening'],
        'reading': ['đọc', 'reading'],
        'writing': ['viết', 'writing'],
        'speaking': ['nói', 'speaking'],
        'test': ['kiểm tra', 'test', 'tổng hợp']
      };
      const keywords = keywordMap[skillType] || [skillType];
      
      const test = lesson.tests.find((t: any) => {
        if (!t.title) return false;
        const titleLower = t.title.toLowerCase();
        return keywords.some(k => titleLower.includes(k));
      });

      if (test && test.userResult?.bestScore != null) {
        const totalPossible = (test.totalQuestions || 0) * 10;
        if (totalPossible === 0) return 0;
        return Math.min(100, Math.round((test.userResult.bestScore / totalPossible) * 100));
      }
      return 0;
    };
`;

code = code.replace(
  /\s*const getSkillProgress = \(skillType: string\) => \{[\s\S]*?return 0;\n    \};\n/,
  "\n" + getSkillProgressCode + "\n"
);

fs.writeFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', code);
