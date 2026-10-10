const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /finalAnswer = \`\\\[AI L.i: \$\{data\.message\}\\\`\];/g,
  "finalAnswer = `[AI Lỗi: ${data.message}]`;"
);

code = code.replace(
  /setSubmitting\(false\);\n\s*\}/,
  `setSubmitting(false);
      }

      // Auto-evaluate writing tests using AI
      if (currentItem?.questionType === 'writing' && textAnswer) {
        setSubmitting(true);
        try {
          const res = await axiosClient.post('/ai/grade-essay', {
            text: textAnswer,
            prompt: currentItem.quesionText
          });
          if (res.data?.success) {
            const score = res.data.data.overallScore || 0;
            finalAnswer = \`[Điểm AI: \${score}%] \${textAnswer}\`;
          } else {
            finalAnswer = \`[AI Lỗi: \${res.data.message}] \${textAnswer}\`;
          }
        } catch (err: any) {
          finalAnswer = \`[AI Error] \${textAnswer}\`;
        }
        setSubmitting(false);
      }`
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
