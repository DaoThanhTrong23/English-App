import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './features/auth/pages/AdminLogin';
import Dashboard from './features/dashboard/pages/Dashboard';
import StudentList from './features/students/pages/StudentList';
import AddWord from './features/words/pages/AddWord';
import WordList from './features/words/pages/WordList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khi vừa vào web http://localhost:5173, tự động bẻ lái sang trang Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Đường dẫn của trang Đăng nhập */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Đường dẫn của trang Quản lý */}
        <Route path="/admin/dashboard" element={<Dashboard />} />

        {/* Đường dẫn của trang Quản lý Học viên */}
        <Route path="/admin/students" element={<StudentList />} />

        {/* Đường dẫn của trang Thêm Từ Vựng */}
        <Route path="/admin/words" element={<WordList />} />
        <Route path="/admin/words/add" element={<AddWord />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

