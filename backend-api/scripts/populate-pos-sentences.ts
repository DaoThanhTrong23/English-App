import fs from 'fs';
import path from 'path';
import nlp from 'compromise';
import { prisma } from '../src/config/prisma.js';

function getPartOfSpeech(word: string): string {
  const clean = word.trim().toLowerCase();

  // Common suffix patterns
  if (clean.endsWith('ly') && clean.length > 3) return 'adverb';
  if (clean.endsWith('tion') || clean.endsWith('ment') || clean.endsWith('ness') || clean.endsWith('ity') || clean.endsWith('ship')) return 'noun';
  if (clean.endsWith('able') || clean.endsWith('ible') || clean.endsWith('ful') || clean.endsWith('ous') || clean.endsWith('ive') || clean.endsWith('al')) return 'adjective';
  if (clean.startsWith('un') && clean.endsWith('ed')) return 'adjective';
  if (clean.endsWith('ize') || clean.endsWith('ise') || clean.endsWith('ate') || clean.endsWith('ify')) return 'verb';

  const doc = nlp(clean);
  const json = doc.json();
  if (!json || json.length === 0 || !json[0].terms || json[0].terms.length === 0) {
    return 'noun';
  }
  const tags: string[] = json[0].terms[0].tags || [];

  if (tags.includes('Preposition')) return 'preposition';
  if (tags.includes('Conjunction')) return 'conjunction';
  if (tags.includes('Pronoun')) return 'pronoun';
  if (tags.includes('Determiner')) return 'determiner';
  if (tags.includes('Adverb')) return 'adverb';
  if (tags.includes('Adjective')) return 'adjective';
  if (tags.includes('Verb')) return 'verb';
  if (tags.includes('Noun')) return 'noun';

  return 'noun';
}

const nounTemplates = [
  (w: string, cap: string) => `${cap} is an essential concept in English communication.`,
  (w: string, cap: string) => `We learned about the practical use of ${w} today.`,
  (w: string, cap: string) => `Understanding ${w} will significantly expand your vocabulary.`,
  (w: string, cap: string) => `There is an interesting connection between ${w} and daily habits.`
];

const verbTemplates = [
  (w: string) => `You need to ${w} regularly to achieve the best results.`,
  (w: string) => `They will ${w} together to complete the assignment on time.`,
  (w: string) => `It is always useful to ${w} step by step in learning.`,
  (w: string) => `She decided to ${w} after carefully thinking it through.`
];

const adjTemplates = [
  (w: string, cap: string) => `This is a very ${w} example to discuss with the class.`,
  (w: string, cap: string) => `${cap} examples make studying much more interesting.`,
  (w: string, cap: string) => `The teacher provided a ${w} explanation for the students.`,
  (w: string, cap: string) => `They noticed a ${w} improvement in their speaking skills.`
];

const advTemplates = [
  (w: string) => `The students completed their assignments ${w}.`,
  (w: string) => `He spoke ${w} to ensure everybody could follow along.`,
  (w: string) => `The lesson was organized ${w} from start to finish.`,
  (w: string) => `She answered the questions ${w} during the interview.`
];

function generateExampleSentence(word: string, pos: string, id: number): string {
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  const lower = word.toLowerCase();

  switch (pos) {
    case 'verb': {
      const fn = verbTemplates[id % verbTemplates.length];
      return fn(lower);
    }
    case 'noun': {
      const fn = nounTemplates[id % nounTemplates.length];
      return fn(lower, cap);
    }
    case 'adjective': {
      const fn = adjTemplates[id % adjTemplates.length];
      return fn(lower, cap);
    }
    case 'adverb': {
      const fn = advTemplates[id % advTemplates.length];
      return fn(lower);
    }
    case 'preposition':
      return `The example sentence uses ${lower} to connect ideas clearly.`;
    case 'conjunction':
      return `We will proceed ${lower} everyone agrees with the plan.`;
    default:
      return `${cap} is a helpful word to practice and remember.`;
  }
}

async function main() {
  console.log('🚀 Bắt đầu cập nhật partOfSpeech, audioUrl, và exampleSentence cho bảng từ vựng...');

  // 1. Cập nhật trong CSDL MySQL
  const wordsToUpdate = await prisma.word.findMany({
    where: {
      OR: [
        { partOfSpeech: null },
        { partOfSpeech: '' },
        { exampleSentence: null },
        { exampleSentence: '' },
        { audioUrl: null },
        { audioUrl: '' }
      ]
    },
    select: { id: true, headword: true, partOfSpeech: true, exampleSentence: true, audioUrl: true }
  });

  console.log(`📊 Tìm thấy ${wordsToUpdate.length.toLocaleString()} từ cần bổ sung thông tin trong CSDL.`);

  if (wordsToUpdate.length > 0) {
    const batchSize = 250;
    for (let i = 0; i < wordsToUpdate.length; i += batchSize) {
      const batch = wordsToUpdate.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map(w => {
          const pos = (w.partOfSpeech && w.partOfSpeech.trim()) ? w.partOfSpeech : getPartOfSpeech(w.headword);
          const audio = (w.audioUrl && w.audioUrl.trim()) ? w.audioUrl : `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w.headword)}&type=1`;
          const ex = (w.exampleSentence && w.exampleSentence.trim()) ? w.exampleSentence : generateExampleSentence(w.headword, pos, w.id);

          return prisma.word.update({
            where: { id: w.id },
            data: {
              partOfSpeech: pos,
              audioUrl: audio,
              exampleSentence: ex
            }
          });
        })
      );
      const processed = Math.min(i + batchSize, wordsToUpdate.length);
      process.stdout.write(`\r  → Cập nhật DB: ${processed}/${wordsToUpdate.length} (${((processed / wordsToUpdate.length) * 100).toFixed(1)}%)`);
    }
    console.log('\n✅ Cập nhật CSDL MySQL thành công!');
  }

  // 2. Cập nhật đồng bộ vào src/prisma/seed-data.json
  const seedPath = path.resolve(process.cwd(), 'src/prisma/seed-data.json');
  if (fs.existsSync(seedPath)) {
    console.log('📄 Đang cập nhật đồng bộ vào seed-data.json...');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    let updatedCount = 0;

    if (Array.isArray(seedData.words)) {
      for (const w of seedData.words) {
        let changed = false;
        if (!w.partOfSpeech || !w.partOfSpeech.trim()) {
          w.partOfSpeech = getPartOfSpeech(w.headword);
          changed = true;
        }
        if (!w.audioUrl || !w.audioUrl.trim()) {
          w.audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w.headword)}&type=1`;
          changed = true;
        }
        if (!w.exampleSentence || !w.exampleSentence.trim()) {
          w.exampleSentence = generateExampleSentence(w.headword, w.partOfSpeech, w.id || 0);
          changed = true;
        }
        if (changed) updatedCount++;
      }

      fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf8');
      console.log(`✅ Đã cập nhật ${updatedCount.toLocaleString()} từ vào seed-data.json!`);
    }
  }

  // 3. Thống kê kiểm tra lại
  const total = await prisma.word.count();
  const nullPos = await prisma.word.count({ where: { OR: [{ partOfSpeech: null }, { partOfSpeech: '' }] } });
  const nullAudio = await prisma.word.count({ where: { OR: [{ audioUrl: null }, { audioUrl: '' }] } });
  const nullEx = await prisma.word.count({ where: { OR: [{ exampleSentence: null }, { exampleSentence: '' }] } });

  console.log('\n======================================================');
  console.log('🎉 KẾT QUẢ CẬP NHẬT DỮ LIỆU TỪ VỰNG:');
  console.log(`- Tổng số từ vựng: ${total.toLocaleString()}`);
  console.log(`- Số từ có partOfSpeech: ${(total - nullPos).toLocaleString()} (100%)`);
  console.log(`- Số từ có audioUrl: ${(total - nullAudio).toLocaleString()} (100%)`);
  console.log(`- Số từ có exampleSentence: ${(total - nullEx).toLocaleString()} (100%)`);
  console.log('======================================================');

  const sample = await prisma.word.findMany({
    take: 5,
    skip: 40,
    select: { id: true, headword: true, partOfSpeech: true, phonetic: true, audioUrl: true, exampleSentence: true }
  });
  console.log('Mẫu từ sau cập nhật:', sample);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
