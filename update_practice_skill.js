const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// Replace the TITLE_MAP matching logic with skillCategory matching
const oldLogic = `            const TITLE_MAP: any = {
              listening: 'Luyện Nghe',
              speaking: 'Luyện Nói',
              reading: 'Luyện Đọc',
              writing: 'Luyện Viết',
              test: 'Luyện Đọc'
            };
            const targetTitle = TITLE_MAP[type as string] || 'Luyện Đọc';
            let targetTest = lesson.tests.find((t: any) => t.title.includes(targetTitle));
            if (!targetTest) targetTest = lesson.tests[0];`;

const newLogic = `            const fallbackTitle = type === 'test' ? 'reading' : type;
            let targetTest = lesson.tests.find((t: any) => t.skillCategory === type);
            // Fallback for old databases
            if (!targetTest) {
                const map: any = { listening: 'Luyện Nghe', speaking: 'Luyện Nói', reading: 'Luyện Đọc', writing: 'Luyện Viết' };
                targetTest = lesson.tests.find((t: any) => t.title?.includes(map[type as string]));
            }
            if (!targetTest) targetTest = lesson.tests[0];`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
