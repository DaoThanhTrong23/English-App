import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  BookA, 
  LogOut, 
  Gamepad2, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  FileQuestion, 
  Trophy, 
  MessageSquare, 
  SlidersHorizontal, 
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import mascotGif from '../../assets/images/gacon.gif';
import { AdminNotificationDropdown } from '../common/AdminNotificationDropdown';
import { useToast } from '../../context/ToastContext';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { path: '/admin/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    title: 'Học tập & Nội dung',
    items: [
      { path: '/admin/students', label: 'Học viên', icon: <Users size={18} /> },
      { path: '/admin/topics', label: 'Chủ đề', icon: <Layers size={18} /> },
      { path: '/admin/courses', label: 'Bài học', icon: <BookOpen size={18} /> },
      { path: '/admin/words', label: 'Từ vựng', icon: <BookA size={18} /> },
      { path: '/admin/tests', label: 'Bài kiểm tra', icon: <FileQuestion size={18} /> },
      { path: '/admin/achievements', label: 'Danh hiệu', icon: <Trophy size={18} /> },
      { path: '/admin/keywords', label: 'Cài đặt từ khóa', icon: <SlidersHorizontal size={18} /> },
    ]
  },
  {
    title: 'Hệ thống & Tương tác',
    items: [
      { path: '/admin/ai-chat', label: 'AI Chat', icon: <MessageSquare size={18} /> },
      { path: '/admin/game', label: 'Trò chơi ôn tập', icon: <Gamepad2 size={18} /> },
      { path: '/admin/topic-levels', label: 'Chủ đề theo cấp độ', icon: <SlidersHorizontal size={18} /> },
      { path: '/admin/logs', label: 'Nhật ký hệ thống', icon: <ClipboardList size={18} /> },
      { path: '/admin/settings', label: 'Cài đặt', icon: <SettingsIcon size={18} /> },
    ]
  }
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmModal } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{
    id?: number | string;
    username?: string;
    name?: string;
    fullName?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    try {
      const stored = localStorage.getItem('adminInfo');
      if (stored) {
        setAdminUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Lỗi parse adminInfo:', e);
    }
  }, [navigate]);

  const handleLogout = () => {
    confirmModal({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?',
      confirmText: 'Đăng xuất',
      isDestructive: true,
      onConfirm: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
      }
    });
  };


  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const getCurrentPageTitle = () => {
    for (const sec of navSections) {
      for (const item of sec.items) {
        if (isActive(item.path)) return item.label;
      }
    }
    return 'Quản trị hệ thống';
  };

  return (
    <div className="admin-layout-shell">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" onClick={() => navigate('/admin/dashboard')}>
          <img src={mascotGif} alt="Mascot" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">English<strong>App</strong></span>
            <span className="brand-badge">Quản trị</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="nav-section-group">
              <div className="nav-section-title">{sec.title}</div>
              <div className="nav-section-items">
                {sec.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      className={`sidebar-nav-item ${active ? 'active' : ''}`}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      title={item.label}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-label">{item.label}</span>
                      {active && <ChevronRight size={14} className="active-arrow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="admin-mini-profile">
            <img 
              src={adminUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.fullName || adminUser?.name || adminUser?.username || 'Admin')}&background=3b82f6&color=fff`} 
              alt="Admin" 
              className="mini-avatar" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.fullName || adminUser?.name || adminUser?.username || 'Admin')}&background=3b82f6&color=fff`;
              }}
            />
            <div className="mini-user-info">
              <span className="mini-name" title={adminUser?.fullName || adminUser?.name || adminUser?.username || 'Admin'}>
                {adminUser?.fullName || adminUser?.name || adminUser?.username || 'Admin'}
              </span>
              <span className="mini-role">
                {adminUser?.role === 'admin' ? 'Quản trị viên' : (adminUser?.role || 'Quản trị viên')}
              </span>
            </div>
            <button className="mini-logout-btn" onClick={handleLogout} title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER (TOPBAR + CONTENT) */}
      <div className="admin-main-wrapper">
        {/* TOP BAR */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-sidebar-toggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="breadcrumb-box">
              <span className="breadcrumb-app">Bảng điều khiển</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{getCurrentPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <AdminNotificationDropdown />
            
            <div className="topbar-user-badge">
              <div className="user-status-dot" title="Hệ thống hoạt động ổn định" />
              <span className="user-badge-text">Trực tuyến</span>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="admin-content-viewport">
          <div className="admin-content-box">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
