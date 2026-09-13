import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './features/auth/AdminLogin';

// Import trang quản lý từ vựng mà lúc nãy bạn tạo
// (Nếu chưa tạo file WordManager.tsx, bạn có thể tạm thêm dấu // ở đầu dòng này để comment nó đi)
import Hello from './features/hello'; // Nhớ trỏ đúng đường dẫn nơi bạn lưu file Hello.tsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khi vừa vào web http://localhost:5173, tự động bẻ lái sang trang Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Đường dẫn của trang Đăng nhập */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Đường dẫn của trang Quản lý từ vựng (Sẽ nhảy vào đây sau khi Đăng nhập thành công) */}
        <Route path="/hello" element={<Hello />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;