import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Library, Search, Bell, LogOut, Gamepad2Icon, SettingsIcon, Menu, X, FileQuestion, Trophy } from 'lucide-react';
import mascotGif from '../../assets/images/gacon.gif';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/students', label: 'Học viên', icon: <Users size={18} /> },
    { path: '/admin/topics', label: 'Chủ đề', icon: <Library size={18} /> },
    { path: '/admin/courses', label: 'Bài học', icon: <BookOpen size={18} /> },
    { path: '/admin/words', label: 'Từ vựng', icon: <Library size={18} /> },
    { path: '/admin/achievements', label: 'Danh hiệu', icon: <Trophy size={18} /> },
    { path: '/admin/tests', label: 'Bài Kiểm Tra', icon: <FileQuestion size={18} /> },
    { path: '/admin/logs', label: 'Nhật ký Hệ thống', icon: <Bell size={18} /> },
    { path: '/admin/game', label: 'Game', icon: <Gamepad2Icon size={18} /> },
    { path: '/admin/settings', label: 'Cài đặt', icon: <SettingsIcon size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/words' && location.pathname.startsWith('/admin/words')) return true;
    if (path === '/admin/courses' && location.pathname.startsWith('/admin/courses')) return true;
    if (path === '/admin/tests' && location.pathname.startsWith('/admin/tests')) return true;
    return location.pathname === path;
  };

  return (
    <div className="admin-layout-top">
      {/* GLOBAL ANIMATED BACKGROUND */}
      <div className="global-animated-bg">
        <div className="animated-orb orb-1"></div>
        <div className="animated-orb orb-2"></div>
        <div className="animated-orb orb-3"></div>
      </div>

      {/* Nền tảng Navbar */}
      <header className="admin-top-navbar glass-navbar">
        <div className="navbar-container">
          {/* Logo Section */}
          <div className="navbar-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <img src={mascotGif} alt="Mascot" className="navbar-mascot" />
            <div className="navbar-logo">
              English<span>App</span>.
            </div>
          </div>

          {/* Menu Section */}
          <nav className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <div key={item.path}
                title={item.label}
                className={`navbar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Right Section (Search, Notification, Profile) */}
          <div className="navbar-right">
            <div className="navbar-search">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Tìm kiếm nhanh..." />
            </div>
            
            <button className="navbar-icon-btn notification-btn">
              <Bell size={30} />
              <span className="notification-badge">3</span> {/*sửa cái thông báo này lại*/}
            </button>
            
            <div className="navbar-profile-section">
              <img src="https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff" alt="Admin" className="navbar-avatar" />
              <div className="navbar-user-info">
                <span className="navbar-user-name">Admin</span>
                <span className="navbar-user-role">Quản trị viên</span>
              </div>
              <button className="navbar-logout-btn" onClick={handleLogout} title="Đăng xuất">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <div className="admin-content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
