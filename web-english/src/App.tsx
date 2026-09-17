import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './features/auth/pages/AdminLogin';
import Dashboard from './features/dashboard/pages/Dashboard';
import StudentList from './features/students/pages/StudentList';
import AddWord from './features/words/pages/AddWord';
import WordList from './features/words/pages/WordList';
import CourseList from './features/courses/pages/CourseList';
import CourseDetail from './features/courses/pages/CourseDetail';
import TopicList from './features/topics/pages/TopicList';
import AchievementList from './features/achievements/pages/AchievementList';
import TestList from './features/tests/pages/TestList';
import TestDetail from './features/tests/pages/TestDetail';
import TestResults from './features/tests/pages/TestResults';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khi vừa vào web http://localhost:5173, tự động chuyển sang trang Login */}
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
        
        {/* Đường dẫn của trang Quản lý Bài học & Chủ đề */}
        <Route path="/admin/topics" element={<TopicList />} />
        <Route path="/admin/courses" element={<CourseList />} />
        <Route path="/admin/courses/:courseId" element={<CourseDetail />} />

        {/* Đường dẫn của trang Quản lý Danh hiệu */}
        <Route path="/admin/achievements" element={<AchievementList />} />

        {/* Đường dẫn của trang Quản lý Bài Kiểm Tra */}
        <Route path="/admin/tests" element={<TestList />} />
        <Route path="/admin/tests/:testId" element={<TestDetail />} />
        <Route path="/admin/tests/:testId/results" element={<TestResults />} />

        {/* Bắt lỗi các trang chưa có (Game, Cài đặt, v.v.) sẽ hiện thông báo thay vì màn hình đen */}
        <Route path="*" element={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h2>Chức năng này đang được phát triển!</h2>
            <a href="/admin/dashboard" style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Quay lại Tổng quan</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;