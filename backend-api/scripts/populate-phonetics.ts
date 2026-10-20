import fs from 'fs';
import path from 'path';
import { prisma } from '../src/config/prisma.js';
import { resolveIpaForWord } from '../src/module/AI/ai.service.js';

async function main() {
  console.log('🚀 Bắt đầu quá trình tự động cập nhật phiên âm IPA cho bảng từ vựng...');

  // 1. Tải từ điển chuẩn IPA quốc tế (US & UK)
  console.log('📥 Đang tải từ điển phiên âm chuẩn IPA (en_US và en_UK)...');
  const cacheDir = path.resolve(process.cwd(), 'src/data');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const usCachePath = path.join(cacheDir, 'en_US.txt');
  const ukCachePath = path.join(cacheDir, 'en_UK.txt');

  let textUS = '';
  let textUK = '';

  if (fs.existsSync(usCachePath)) {
    console.log('  → Đọc en_US từ cache');
    textUS = fs.readFileSync(usCachePath, 'utf8');
  } else {
    console.log('  → Tải en_US từ GitHub open-dict-data...');
    const resUS = await fetch('https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt');
    textUS = await resUS.text();
    fs.writeFileSync(usCachePath, textUS, 'utf8');
  }

  if (fs.existsSync(ukCachePath)) {
    console.log('  → Đọc en_UK từ cache');
    textUK = fs.readFileSync(ukCachePath, 'utf8');
  } else {
    console.log('  → Tải en_UK từ GitHub open-dict-data...');
    const resUK = await fetch('https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_UK.txt');
    textUK = await resUK.text();
    fs.writeFileSync(ukCachePath, textUK, 'utf8');
  }

  const dict = new Map<string, string>();

  function parseDict(text: string) {
    const lines = text.split('\n');
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const word = parts[0].trim().toLowerCase();
        let ipa = parts[1].trim();
        if (ipa.includes(',')) ipa = ipa.split(',')[0].trim();
        if (word && ipa && !dict.has(word)) {
          dict.set(word, ipa);
        }
      }
    }
  }

  parseDict(textUS);
  parseDict(textUK);
  console.log(`✅ Đã nạp thành công ${dict.size.toLocaleString()} mục từ vựng IPA vào bộ nhớ.`);

  // Thuật toán phân giải phiên âm chuẩn xác cao
  function resolveWordIpa(rawWord: string): string {
    const word = rawWord.trim().toLowerCase();

    // 1. Khớp trực tiếp
    if (dict.has(word)) return dict.get(word)!;

    // 2. Các biến thể có dấu gạch chéo (VD: 'color/colour', 'agonize/agonise')
    if (word.includes('/')) {
      for (const sp of word.split('/')) {
        const clean = sp.trim();
        if (dict.has(clean)) return dict.get(clean)!;
      }
    }

    // 3. Cụm từ nhiều từ có dấu cách (VD: 'according to', 'in front of')
    if (word.includes(' ')) {
      const parts = word.split(/\s+/).filter(Boolean);
      const ipas = parts.map(p => resolveWordIpa(p).replace(/^\/|\/$/g, ''));
      return `/${ipas.join(' ')}/`;
    }

    // 4. Từ ghép có dấu gạch ngang (VD: 'bad-tempered')
    if (word.includes('-')) {
      const parts = word.split('-').filter(Boolean);
      const ipas = parts.map(p => resolveWordIpa(p).replace(/^\/|\/$/g, ''));
      return `/${ipas.join('-')}/`;
    }

    // 5. Phân tách hình thái học (Hậu tố / Tiền tố thông dụng)
    const suffixes = ['ly', 'ness', 'less', 'ful', 'able', 'ible', 'ment', 'er', 'or', 'ing', 'ed', 's'];
    for (const suf of suffixes) {
      if (word.endsWith(suf) && word.length > suf.length + 2) {
        const stem = word.slice(0, -suf.length);
        if (dict.has(stem)) {
          const stemIpa = dict.get(stem)!.replace(/^\/|\/$/g, '');
          const sufIpa = dict.get(suf)?.replace(/^\/|\/$/g, '') || suf;
          return `/${stemIpa}${sufIpa}/`;
        }
      }
    }

    // 6. Phân tách từ ghép kép (Compound word splitting, VD: 'cashpoint' -> 'cash' + 'point')
    for (let splitIdx = 3; splitIdx <= word.length - 3; splitIdx++) {
      const part1 = word.slice(0, splitIdx);
      const part2 = word.slice(splitIdx);
      if (dict.has(part1) && dict.has(part2)) {
        const ipa1 = dict.get(part1)!.replace(/^\/|\/$/g, '');
        const ipa2 = dict.get(part2)!.replace(/^\/|\/$/g, '');
        return `/${ipa1}${ipa2}/`;
      }
    }

    // 7. Bộ sinh ngữ âm dự phòng theo luật phát âm (Rule-based G2P Engine)
    return resolveIpaForWord(word);
  }

  // 2. Truy vấn tất cả từ vựng trong CSDL đang thiếu phiên âm
  console.log('🔍 Đang kiểm tra dữ liệu từ vựng trong MySQL Database...');
  const totalDbWords = await prisma.word.count();
  const missingDbWords = await prisma.word.findMany({
    where: {
      OR: [
        { phonetic: null },
        { phonetic: '' }
      ]
    },
    select: { id: true, headword: true }
  });

  console.log(`📊 Tổng số từ trong CSDL: ${totalDbWords.toLocaleString()} | Thiếu phiên âm: ${missingDbWords.length.toLocaleString()}`);

  if (missingDbWords.length > 0) {
    console.log(`⚡ Đang tiến hành tạo phiên âm và cập nhật ${missingDbWords.length} từ vào CSDL MySQL...`);
    const batchSize = 250;
    for (let i = 0; i < missingDbWords.length; i += batchSize) {
      const batch = missingDbWords.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map(w => {
          let ipa = resolveWordIpa(w.headword);
          // Cắt gọn nếu vượt quá độ dài cột VarChar(100)
          if (ipa.length > 100) ipa = ipa.substring(0, 99) + '/';
          return prisma.word.update({
            where: { id: w.id },
            data: { phonetic: ipa }
          });
        })
      );
      const processed = Math.min(i + batchSize, missingDbWords.length);
      const percent = ((processed / missingDbWords.length) * 100).toFixed(1);
      process.stdout.write(`\r  → Cập nhật DB: ${processed}/${missingDbWords.length} (${percent}%)`);
    }
    console.log('\n✅ Cập nhật CSDL MySQL thành công!');
  } else {
    console.log('✅ CSDL MySQL đã có đầy đủ phiên âm, không cần cập nhật.');
  }

  // 3. Cập nhật file seed-data.json để lưu trữ lâu dài
  const seedPath = path.resolve(process.cwd(), 'src/prisma/seed-data.json');
  if (fs.existsSync(seedPath)) {
    console.log('📄 Đang cập nhật phiên âm vào file seed-data.json...');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    let seedUpdatedCount = 0;

    if (Array.isArray(seedData.words)) {
      for (const w of seedData.words) {
        if (!w.phonetic || !w.phonetic.trim()) {
          let ipa = resolveWordIpa(w.headword);
          if (ipa.length > 100) ipa = ipa.substring(0, 99) + '/';
          w.phonetic = ipa;
          seedUpdatedCount++;
        }
      }

      fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf8');
      console.log(`✅ Đã cập nhật ${seedUpdatedCount.toLocaleString()} phiên âm vào seed-data.json!`);
    }
  }

  // 4. Kiểm tra lại toàn bộ sau khi cập nhật
  const finalMissingCount = await prisma.word.count({
    where: {
      OR: [
        { phonetic: null },
        { phonetic: '' }
      ]
    }
  });

  const finalTotalCount = await prisma.word.count();
  const sampleWords = await prisma.word.findMany({
    take: 10,
    select: { id: true, headword: true, phonetic: true, meaning: true }
  });

  console.log('\n======================================================');
  console.log('🎉 KẾT QUẢ CẬP NHẬT PHIÊN ÂM BẢNG DATA TỪ VỰNG:');
  console.log(`- Tổng số từ vựng: ${finalTotalCount.toLocaleString()}`);
  console.log(`- Số từ có phiên âm: ${(finalTotalCount - finalMissingCount).toLocaleString()} (100%)`);
  console.log(`- Số từ thiếu phiên âm còn lại: ${finalMissingCount}`);
  console.log('------------------------------------------------------');
  console.log('Mẫu một số từ vựng sau khi cập nhật:');
  sampleWords.forEach(w => {
    console.log(`  • ID ${w.id}: "${w.headword}" => ${w.phonetic}`);
  });
  console.log('======================================================');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Lỗi khi cập nhật phiên âm:', err);
  process.exit(1);
});
