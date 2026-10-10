const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// 1. Add aiResults state
if (!code.includes('const [aiResults, setAiResults] = useState<any[]>([])')) {
  code = code.replace(
    /const \[resultData, setResultData\] = useState<any>\(null\);/,
    "const [resultData, setResultData] = useState<any>(null);\n  const [aiResults, setAiResults] = useState<any[]>([]);"
  );
}

// 2. Capture AI score for Speaking
code = code.replace(
  /finalAnswer = \`\[Điểm AI: \$\{score\}%\] \(Nói: \$\{data\.data\.transcript\}\)\`;/,
  "finalAnswer = `[Điểm AI: ${score}%] (Nói: ${data.data.transcript})`;\n            setAiResults(prev => [...prev, { type: 'Nói', score: data.data.overallScore, feedback: data.data.feedback, transcript: data.data.transcript }]);"
);

// 3. Capture AI score for Writing
code = code.replace(
  /finalAnswer = \`\[Điểm AI: \$\{Math\.round\(score \* 10\)\}%\] \$\{textAnswer\}\`;/,
  "finalAnswer = `[Điểm AI: ${Math.round(score * 10)}%] ${textAnswer}`;\n              setAiResults(prev => [...prev, { type: 'Viết', score: res.data.data.overallScore, feedback: res.data.data.feedback, improved: res.data.data.improvedVersion }]);"
);

// 4. Render aiResults in the completion screen
const renderAiResults = `
        {aiResults.length > 0 && (
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginBottom: 20}}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#111827'}}>Đánh giá từ AI:</Text>
            {aiResults.map((r, i) => (
              <View key={i} style={{backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb'}}>
                <Text style={{fontWeight: 'bold', color: '#3b82f6', fontSize: 16}}>Kỹ năng {r.type}: {r.score} / 10 điểm</Text>
                {r.transcript && <Text style={{fontStyle: 'italic', marginTop: 5, color: '#4b5563'}}>AI nghe được: "{r.transcript}"</Text>}
                <Text style={{marginTop: 10, color: '#374151', lineHeight: 22}}>{r.feedback}</Text>
                {r.improved && (
                  <View style={{marginTop: 10, backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', fontSize: 12, color: '#6b7280'}}>GỢI Ý NÂNG CẤP:</Text>
                    <Text style={{color: '#111827', marginTop: 5}}>{r.improved}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
`;

code = code.replace(
  /<Text style=\{\{fontSize: 16, color: '#6b7280', marginBottom: 30\}\}>Bạn đã làm được \{resultData\.totalScore \|\| 0\} \/ \{\(resultData\.totalQuestions \|\| 0\) \* 10\} điểm\.<\/Text>/,
  "<Text style={{fontSize: 16, color: '#6b7280', marginBottom: 20}}>XP nhận được: {resultData.totalScore || 0} / {(resultData.totalQuestions || 0) * 10} điểm.</Text>\n" + renderAiResults
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
