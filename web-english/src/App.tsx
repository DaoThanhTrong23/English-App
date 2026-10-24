import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';

// Keep login eager or lazy
const AdminLogin = lazy(() => import('./features/auth/pages/AdminLogin'));
const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const StudentList = lazy(() => import('./features/students/pages/StudentList'));
const AddWord = lazy(() => import('./features/words/pages/AddWord'));
const WordList = lazy(() => import('./features/words/pages/WordList'));
const CourseList = lazy(() => import('./features/courses/pages/CourseList'));
const CourseDetail = lazy(() => import('./features/courses/pages/CourseDetail'));
const TopicList = lazy(() => import('./features/topics/pages/TopicList'));
const KeywordSettings = lazy(() => import('./features/keywords/pages/KeywordSettings'));
const AchievementList = lazy(() => import('./features/achievements/pages/AchievementList'));
const SystemLogs = lazy(() => import('./features/system-logs/pages/SystemLogs'));
const Settings = lazy(() => import('./features/settings/pages/Settings'));
const TestList = lazy(() => import('./features/tests/pages/TestList'));
const TestDetail = lazy(() => import('./features/tests/pages/TestDetail'));
const TestResults = lazy(() => import('./features/tests/pages/TestResults'));
const AiChatList = lazy(() => import('./features/ai-chat/pages/AiChatList'));
const GameList = lazy(() => import('./features/game/pages/GameList'));
const TopicLevels = lazy(() => import('./features/topics/pages/TopicLevels'));
const RoleList = lazy(() => import('./features/roles/pages/RoleList'));
const StaffList = lazy(() => import('./features/staff/pages/StaffList'));

const PageLoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px' }}>
    <div style={{
      width: '38px',
      height: '38px',
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Đang tải dữ liệu trang...</span>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
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
            <Route path="/admin/keywords" element={<KeywordSettings />} />
            <Route path="/admin/courses" element={<CourseList />} />
            <Route path="/admin/courses/:courseId" element={<CourseDetail />} />

            {/* Đường dẫn của trang Quản lý Danh hiệu */}
            <Route path="/admin/achievements" element={<AchievementList />} />

            {/* Đường dẫn của trang Quản lý Bài Kiểm Tra */}
            <Route path="/admin/tests" element={<TestList />} />
            <Route path="/admin/tests/:testId" element={<TestDetail />} />
            <Route path="/admin/tests/:testId/results" element={<TestResults />} />

            {/* Hệ thống */}
            <Route path="/admin/staff" element={<StaffList />} />
            <Route path="/admin/roles" element={<RoleList />} />
            <Route path="/admin/logs" element={<SystemLogs />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/ai-chat" element={<AiChatList />} />
            <Route path="/admin/game" element={<GameList />} />
            <Route path="/admin/topic-levels" element={<TopicLevels />} />

            {/* Bắt lỗi các trang chưa có sẽ hiện thông báo */}
            <Route path="*" element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <h2>Chức năng này đang được phát triển!</h2>
                <a href="/admin/dashboard" style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Quay lại Tổng quan</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;