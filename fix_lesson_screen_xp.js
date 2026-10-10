const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', 'utf8');

const getSkillScoreCode = `
    const getSkillScore = (skillType: string) => {
      if (!lesson || !lesson.tests) return { score: 0, max: 0, pct: 0 };
      
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

      if (test) {
        const totalPossible = (test.totalQuestions || 0) * 10;
        const score = test.userResult?.bestScore || 0;
        const pct = totalPossible === 0 ? 0 : Math.min(100, Math.round((score / totalPossible) * 100));
        return { score, max: totalPossible, pct };
      }
      return { score: 0, max: 0, pct: 0 };
    };
`;

code = code.replace(
  /\s*const getSkillProgress = \(skillType: string\) => \{[\s\S]*?return 0;\n    \};\n/,
  "\n" + getSkillScoreCode + "\n"
);

// Replace completedSkills calculation
code = code.replace(
  /\.filter\(type => getSkillProgress\(type\) > 0\)\.length;/,
  ".filter(type => getSkillScore(type).score > 0).length;"
);

// Replace rendering of progress in UI
code = code.replace(
  /\{getSkillProgress\('listening'\)\}%\<\/Text\>/,
  "{getSkillScore('listening').score}/{getSkillScore('listening').max} XP</Text>"
);
code = code.replace(
  /\{getSkillProgress\('reading'\)\}%\<\/Text\>/,
  "{getSkillScore('reading').score}/{getSkillScore('reading').max} XP</Text>"
);
code = code.replace(
  /\{getSkillProgress\('writing'\)\}%\<\/Text\>/,
  "{getSkillScore('writing').score}/{getSkillScore('writing').max} XP</Text>"
);
code = code.replace(
  /\{getSkillProgress\('speaking'\)\}%\<\/Text\>/,
  "{getSkillScore('speaking').score}/{getSkillScore('speaking').max} XP</Text>"
);
code = code.replace(
  /\{getSkillProgress\('test'\)\}%\<\/Text\>/,
  "{getSkillScore('test').score}/{getSkillScore('test').max} XP</Text>"
);

fs.writeFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', code);
