import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import mascotGif from '../../assets/images/gacon.gif';
import { AdminNotificationDropdown } from '../common/AdminNotificationDropdown';
import { useToast } from '../../context/ToastContext';
import { axiosClient } from '../../config/axios';
import './AdminLayout.css';

const getAvatarUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: string | string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { 
        path: '/admin/dashboard', 
        label: 'Tổng quan', 
        icon: <LayoutDashboard size={18} />,
        requiredPermission: 'READ_DASHBOARD_STATS'
      },
    ]
  },
  {
    title: 'Học tập & Nội dung',
    items: [
      { 
        path: '/admin/students', 
        label: 'Học viên', 
        icon: <Users size={18} />,
        requiredPermission: 'READ_STUDENT_LIST'
      },
      { 
        path: '/admin/topics', 
        label: 'Chủ đề', 
        icon: <Layers size={18} />,
        requiredPermission: 'READ_TOPIC_LIST'
      },
      { 
        path: '/admin/courses', 
        label: 'Bài học', 
        icon: <BookOpen size={18} />,
        requiredPermission: 'READ_COURSE_LIST'
      },
      { 
        path: '/admin/words', 
        label: 'Từ vựng', 
        icon: <BookA size={18} />,
        requiredPermission: 'READ_WORD_LIST'
      },
      { 
        path: '/admin/tests', 
        label: 'Bài kiểm tra', 
        icon: <FileQuestion size={18} />,
        requiredPermission: 'READ_TEST_LIST'
      },
      { 
        path: '/admin/achievements', 
        label: 'Danh hiệu', 
        icon: <Trophy size={18} />,
        requiredPermission: 'READ_ACHIEVEMENT_LIST'
      },
      { 
        path: '/admin/keywords', 
        label: 'Cài đặt từ khóa', 
        icon: <SlidersHorizontal size={18} />,
        requiredPermission: 'READ_KEYWORD_SETTING_LIST'
      },
    ]
  },
  {
    title: 'Hệ thống & Tương tác',
    items: [
      { 
        path: '/admin/staff', 
        label: 'Quản lý nhân viên', 
        icon: <UserCheck size={18} />,
        requiredPermission: ['READ_ROLE_LIST', 'READ_ROLE_DETAIL']
      },
      { 
        path: '/admin/roles', 
        label: 'Vai trò & Phân quyền', 
        icon: <ShieldCheck size={18} />,
        requiredPermission: 'READ_ROLE_LIST'
      },
      { 
        path: '/admin/ai-chat', 
        label: 'AI Chat', 
        icon: <MessageSquare size={18} />,
        requiredPermission: ['READ_AI_ADMIN_SESSIONS', 'READ_AI_ADMIN_STATS']
      },
      { 
        path: '/admin/game', 
        label: 'Trò chơi ôn tập', 
        icon: <Gamepad2 size={18} />,
        requiredPermission: ['READ_GAME_SETTING_LIST', 'READ_GAME_LIST']
      },
      { 
        path: '/admin/topic-levels', 
        label: 'Chủ đề theo cấp độ', 
        icon: <SlidersHorizontal size={18} />,
        requiredPermission: 'READ_TOPIC_SETTING_LIST'
      },
      { 
        path: '/admin/logs', 
        label: 'Nhật ký hệ thống', 
        icon: <ClipboardList size={18} />,
        requiredPermission: 'READ_ACTIVITY_LOG_LIST'
      },
      { 
        path: '/admin/settings', 
        label: 'Cài đặt', 
        icon: <SettingsIcon size={18} />,
        requiredPermission: 'READ_PROFILE'
      },
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
    permissions?: string[];
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

    // Luôn fetch permissions & thông tin mới nhất từ API để đảm bảo đồng bộ
    axiosClient.get('/admin/staff/me')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const fetched = res.data.data;
          setAdminUser(prev => ({ ...prev, ...fetched }));
          try {
            const currentStored = localStorage.getItem('adminInfo');
            const merged = { ...(currentStored ? JSON.parse(currentStored) : {}), ...fetched };
            localStorage.setItem('adminInfo', JSON.stringify(merged));
          } catch {
            localStorage.setItem('adminInfo', JSON.stringify(fetched));
          }
        }
      })
      .catch(() => {
        // Fallback /profile/me nếu cần
        axiosClient.get('/profile/me')
          .then(res => {
            if (res.data?.success && res.data?.data) {
              const fetched = res.data.data;
              setAdminUser(prev => ({ ...prev, ...fetched }));
            }
          })
          .catch(() => {});
      });
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

  /**
   * Kiểm tra quyền xem của tài nguyên
   */
  const hasPermission = (required?: string | string[]): boolean => {
    if (!required) return true;
    if (adminUser?.role?.toLowerCase() === 'admin') return true;

    const userPerms = adminUser?.permissions;
    if (!userPerms || !Array.isArray(userPerms)) return false;

    if (Array.isArray(required)) {
      return required.some(p => userPerms.includes(p));
    }
    return userPerms.includes(required);
  };

  // Chỉ hiển thị các mục nav mà tài khoản có quyền xem; các mục không có quyền sẽ không render nút
  const visibleNavSections = useMemo(() => {
    return navSections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(item => hasPermission(item.requiredPermission))
      }))
      .filter(sec => sec.items.length > 0);
  }, [adminUser]);

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const getCurrentPageTitle = () => {
    for (const sec of visibleNavSections) {
      for (const item of sec.items) {
        if (isActive(item.path)) return item.label;
      }
    }
    return 'Quản trị hệ thống';
  };

  // Tìm mục hiện tại trên URL để kiểm tra quyền truy cập trực tiếp
  const currentNavItem = useMemo(() => {
    return navSections
      .flatMap(s => s.items)
      .find(it => {
        if (it.path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
        return location.pathname.startsWith(it.path);
      });
  }, [location.pathname]);

  const isUnauthorized = Boolean(
    adminUser &&
    currentNavItem?.requiredPermission &&
    !hasPermission(currentNavItem.requiredPermission)
  );

  const handleBrandClick = () => {
    if (hasPermission('READ_DASHBOARD_STATS')) {
      navigate('/admin/dashboard');
    } else {
      const firstPath = visibleNavSections[0]?.items[0]?.path || '/admin/settings';
      navigate(firstPath);
    }
  };

  return (
    <div className="admin-layout-shell">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
          <img src={mascotGif} alt="Mascot" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">English<strong>App</strong></span>
            <span className="brand-badge">Quản trị</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleNavSections.map((sec, sIdx) => (
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
              src={getAvatarUrl(adminUser?.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.fullName || adminUser?.name || adminUser?.username || 'Admin')}&background=3b82f6&color=fff`} 
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
            {isUnauthorized ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <ShieldAlert size={56} style={{ color: '#ef4444', marginBottom: '16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  Không có quyền truy cập
                </h2>
                <p style={{ color: '#6b7280', maxWidth: '450px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                  Tài khoản của bạn không có quyền xem tài nguyên này. Vui lòng liên hệ Quản trị viên nếu bạn cần được cấp quyền hạn!
                </p>
                <button
                  onClick={() => {
                    const first = visibleNavSections[0]?.items[0]?.path || '/admin/settings';
                    navigate(first);
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  Về trang được cấp quyền
                </button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
