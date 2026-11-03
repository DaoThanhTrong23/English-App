import { prisma } from '../src/config/prisma.js';

// Khai báo kiểu toàn cục cho process trong môi trường script Node.js (để VS Code / TypeScript không báo lỗi)
declare const process: any;

/**
 * =========================================================================
 * CẤU HÌNH THỜI GIAN VÀ CHỐNG CHẶN IP (ANTI RATE-LIMIT CONFIG)
 * =========================================================================
 */
// Thời gian nghỉ giữa mỗi từ (mili-giây): 250ms tương đương ~4 từ/giây (nhịp độ tự nhiên, chống bị Google cấm IP)
const DELAY_BETWEEN_WORDS_MS = 500;

// Thời gian tạm nghỉ khi phát hiện bị Google trả về mã 429 (giây) trước khi tự động thử lại
const RATE_LIMIT_COOLDOWN_SECONDS = 30;

// Hàm tạm dừng
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface TranslateResult {
  meaning: string | null;
  isRateLimited: boolean;
}

// Hàm gọi API Google Translate có cơ chế phát hiện chặn IP (HTTP 429)
async function translateEnToVi(text: string): Promise<TranslateResult> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Phát hiện bị Google chặn tốc độ
    if (res.status === 429) {
      return { meaning: null, isRateLimited: true };
    }

    if (!res.ok) {
      return { meaning: null, isRateLimited: false };
    }

    const textBody = await res.text();
    // Nếu Google trả về trang HTML "Sorry..." thay vì chuỗi JSON -> Đang bị chặn
    if (textBody.trim().startsWith('<')) {
      return { meaning: null, isRateLimited: true };
    }

    const data = JSON.parse(textBody);
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translated = String(data[0][0][0]).trim();
      return {
        meaning: translated.length > 0 ? translated : null,
        isRateLimited: false
      };
    }

    return { meaning: null, isRateLimited: false };
  } catch {
    return { meaning: null, isRateLimited: false };
  }
}

async function main() {
  console.log('================================================================');
  console.log('🔄 KIỂM TRA TIẾN TRÌNH DỊCH TỪ VỰNG TIẾNG ANH (AUTO-RESUME)');
  console.log('================================================================');

  // 1. Thống kê tổng quan dữ liệu hiện tại trong Database
  const totalInDb = await prisma.word.count();
  const completedCount = await prisma.word.count({
    where: {
      AND: [
        { meaning: { not: { startsWith: 'Nghĩa của ' } } },
        { meaning: { not: '' } }
      ]
    }
  });

  // 2. Chỉ lấy các từ CÒN LẠI cần dịch (Nghĩa của % hoặc rỗng) -> KHÔNG DỊCH LẠI TỪ ĐÃ XONG
  const wordsRemaining = await prisma.word.findMany({
    where: {
      OR: [
        { meaning: { startsWith: 'Nghĩa của ' } },
        { meaning: null },
        { meaning: '' }
      ]
    },
    select: { id: true, headword: true },
    orderBy: { id: 'asc' }
  });

  const remainingTotal = wordsRemaining.length;

  console.log(`📊 Tổng số từ vựng trong CSDL:       ${totalInDb} từ`);
  console.log(`✅ Đã hoàn thành trước đó:           ${completedCount} từ`);
  console.log(`⏳ Số từ CÒN LẠI cần dịch tiếp:       ${remainingTotal} từ\n`);

  if (remainingTotal === 0) {
    console.log('🎉 Toàn bộ từ vựng đã có nghĩa tiếng Việt đầy đủ! Không còn từ nào cần dịch.');
    return;
  }

  console.log(`🚀 Bắt đầu dịch tiếp từ từ số [${completedCount + 1}] / [${totalInDb}]...`);
  console.log(`⚙️  Nhịp độ: ${DELAY_BETWEEN_WORDS_MS}ms / từ (đều đặn, chống sốc lưu lượng tới Google)`);
  console.log(`🛡️  Bảo vệ 429: Tự động chờ ${RATE_LIMIT_COOLDOWN_SECONDS}s nếu Google yêu cầu giảm tốc độ.\n`);

  let currentSuccess = 0;
  let currentFailed = 0;

  for (let i = 0; i < remainingTotal; i++) {
    const word = wordsRemaining[i];
    let attempts = 0;
    let translated: string | null = null;

    // Cơ chế retry an toàn khi dính 429
    while (attempts < 3) {
      const res = await translateEnToVi(word.headword);

      if (res.isRateLimited) {
        attempts++;
        console.log(
          `\n⚠️  [Cảnh báo 429] Google yêu cầu hạ nhiệt độ mạng. Tạm dừng ${RATE_LIMIT_COOLDOWN_SECONDS} giây trước khi tiếp tục từ "${word.headword}"...`
        );
        await sleep(RATE_LIMIT_COOLDOWN_SECONDS * 1000);
        continue;
      }

      translated = res.meaning;
      break;
    }

    if (translated) {
      await prisma.word.update({
        where: { id: word.id },
        data: { meaning: translated }
      });
      currentSuccess++;
    } else {
      currentFailed++;
    }

    const currentCompletedTotal = completedCount + currentSuccess;
    const progressPercent = ((currentCompletedTotal / totalInDb) * 100).toFixed(1);

    process.stdout.write(
      `\r⏳ Tiến độ toàn hệ thống: [${currentCompletedTotal}/${totalInDb}] (${progressPercent}%) | Phiên này đã dịch: +${currentSuccess} | Bỏ qua: ${currentFailed}`
    );

    // Nghỉ nhẹ nhàng giữa mỗi từ để không bị đánh dấu là bot spam
    await sleep(DELAY_BETWEEN_WORDS_MS);
  }

  console.log(`\n\n================================================================`);
  console.log(`🎉 HOÀN THÀNH ĐỢT DỊCH!`);
  console.log(`- Phiên này đã dịch thành công: +${currentSuccess} từ`);
  console.log(`- Không thể tra cứu:            ${currentFailed} từ`);
  console.log(`- Tổng số từ đã có nghĩa trong DB: ${completedCount + currentSuccess}/${totalInDb}`);
  console.log(`================================================================`);
}

main()
  .catch((e) => {
    console.error('\n❌ Xảy ra lỗi ngoài ý muốn:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
