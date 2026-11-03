const fs = require('fs');
const path = require('path');
const ngrok = require('@ngrok/ngrok');

// 1. Tìm authtoken của ngrok
function getAuthToken() {
  if (process.env.NGROK_AUTHTOKEN) {
    return process.env.NGROK_AUTHTOKEN.trim();
  }

  // Đọc từ file ngrok.yml của hệ thống
  const localAppData = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || '';
  const possiblePaths = [
    path.join(localAppData, 'ngrok', 'ngrok.yml'),
    path.join(userProfile, '.config', 'ngrok', 'ngrok.yml'),
    path.join(userProfile, 'AppData', 'Local', 'ngrok', 'ngrok.yml'),
  ];

  for (const cfgPath of possiblePaths) {
    if (fs.existsSync(cfgPath)) {
      try {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const match = raw.match(/authtoken:\s*([^\s\r\n]+)/);
        if (match && match[1]) {
          return match[1].replace(/['"]/g, '').trim();
        }
      } catch (e) {}
    }
  }

  return null;
}

// 2. Tự động ghi URL vào file .env của mobile-english
function updateMobileEnv(apiUrl) {
  const mobileEnvPath = path.resolve(__dirname, '..', '..', 'mobile-english', '.env');
  const envContent = `# TỰ ĐỘNG TẠO BỞI NGROK TUNNEL - KHÔNG CẦN SỬA TAY
EXPO_PUBLIC_API_URL=${apiUrl}
`;
  try {
    fs.writeFileSync(mobileEnvPath, envContent, 'utf8');
    console.log(`[OK] Đã tự động cập nhật: mobile-english/.env -> ${apiUrl}`);
  } catch (err) {
    console.warn(`[WARN] Không thể tự động ghi file mobile-english/.env:`, err.message);
  }
}

// 3. Tự động ghi URL vào file .env của web-english
function updateWebEnv(apiUrl) {
  const webEnvPath = path.resolve(__dirname, '..', '..', 'web-english', '.env');
  const envContent = `# TỰ ĐỘNG TẠO BỞI NGROK TUNNEL - KHÔNG CẦN SỬA TAY
VITE_API_URL=${apiUrl}
`;
  try {
    fs.writeFileSync(webEnvPath, envContent, 'utf8');
    console.log(`[OK] Đã tự động cập nhật: web-english/.env -> ${apiUrl}`);
  } catch (err) {
    console.warn(`[WARN] Không thể tự động ghi file web-english/.env:`, err.message);
  }
}

async function startTunnel() {
  const token = getAuthToken();
  const port = process.env.PORT || 3000;

  console.log('\n======================================================');
  console.log('       KHỞI TẠO NGROK TUNNEL CHO DỰ ÁN ENGLISH APP      ');
  console.log('======================================================');

  if (!token) {
    console.error('\n[LỖI] Không tìm thấy Ngrok Authtoken!');
    console.error('Vui lòng lấy authtoken miễn phí tại https://dashboard.ngrok.com/get-started/your-authtoken');
    console.error('Sau đó lưu bằng lệnh: npx ngrok config add-authtoken <TOKEN_CỦA_BẠN>');
    process.exit(1);
  }

  try {
    console.log(`\nĐang kết nối Ngrok tới Backend API (port ${port})...`);
    const listener = await ngrok.forward({
      addr: Number(port),
      authtoken: token,
    });

    const publicUrl = listener.url();
    const apiUrl = `${publicUrl}/api`;

    // Cập nhật cấu hình cho Mobile và Web Admin
    updateMobileEnv(apiUrl);
    updateWebEnv(apiUrl);

    console.log('\n======================================================');
    console.log(`   NGROK TUNNEL ĐANG HOẠT ĐỘNG THÀNH CÔNG!          `);
    console.log('======================================================');
    console.log(` -> Đường dẫn công khai:  ${publicUrl}`);
    console.log(` -> Endpoint API di động:  ${apiUrl}`);
    console.log('------------------------------------------------------');
    console.log(' Giờ đây bạn có thể mở điện thoại (4G / 5G / ngoài đường)');
    console.log(' và sử dụng ứng dụng mọi lúc mọi nơi!');
    console.log('------------------------------------------------------');
    console.log(' Nhấn [Ctrl + C] bất cứ lúc nào để dừng Tunnel.\n');

    // Bắt sự kiện thoát an toàn
    const cleanup = async () => {
      console.log('\nĐang đóng Ngrok tunnel...');
      try {
        await listener.close();
      } catch (e) {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Giữ tiến trình luôn chạy (Keep-alive) cho đến khi bấm Ctrl+C
    const keepAlive = setInterval(() => {}, 1000 * 60 * 60);
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        clearInterval(keepAlive);
        resolve();
      });
    });
  } catch (err) {
    console.error('\n[LỖI KHI BẬT NGROK]:', err.message || err);
    process.exit(1);
  }
}

startTunnel();
