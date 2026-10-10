const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', 'utf8');

// 1. Move getSkillProgress to the top (before completedSkills)
code = code.replace(
  /\s*const getSkillProgress = \(skillType: string\) => \{[\s\S]*?return 0;\n    \};\n/,
  ""
);

const getSkillProgressCode = `
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

code = code.replace(
  /const completedSkills = \['listening', 'reading', 'writing', 'speaking', 'test'\]/,
  getSkillProgressCode + "\n    const completedSkills = ['listening', 'reading', 'writing', 'speaking', 'test']"
);

// 2. Fix the skillType rendering for each skill
code = code.replace(/\{getSkillProgress\('test'\)\}%\<\/Text\>/g, "MATCH_ME");

const parts = code.split("MATCH_ME");
if (parts.length === 6) {
  code = parts[0] + "{getSkillProgress('listening')}%</Text>" +
         parts[1] + "{getSkillProgress('reading')}%</Text>" +
         parts[2] + "{getSkillProgress('writing')}%</Text>" +
         parts[3] + "{getSkillProgress('speaking')}%</Text>" +
         parts[4] + "{getSkillProgress('test')}%</Text>" +
         parts[5];
}

fs.writeFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', code);
