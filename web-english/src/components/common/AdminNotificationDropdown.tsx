import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  UserPlus, 
  Award, 
  Lock, 
  Unlock, 
  Sparkles, 
  Clock, 
  Check, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  clearAllNotifications,
  type AdminNotification 
} from '../../features/notifications/api/notification.api';
import './AdminNotificationDropdown.css';

export const AdminNotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Lỗi tải thông báo admin:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Tự động kiểm tra thông báo mới mỗi 30 giây
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifs();
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa tất cả thông báo?')) return;
    try {
      setLoading(true);
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);
    const titleLower = notif.title.toLowerCase();
    if (titleLower.includes('đăng ký') || titleLower.includes('khóa') || titleLower.includes('mở khóa')) {
      navigate('/admin/students');
    } else if (titleLower.includes('xếp hạng') || titleLower.includes('thăng hạng') || titleLower.includes('cấp')) {
      navigate('/admin/students');
    } else {
      navigate('/admin/logs');
    }
  };

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('đăng ký')) {
      return <div className="notif-icon-box icon-register"><UserPlus size={16} /></div>;
    }
    if (t.includes('thăng hạng') || t.includes('lên cấp') || t.includes('xếp hạng')) {
      return <div className="notif-icon-box icon-award"><Award size={16} /></div>;
    }
    if (t.includes('khóa')) {
      return <div className="notif-icon-box icon-lock"><Lock size={16} /></div>;
    }
    if (t.includes('mở khóa')) {
      return <div className="notif-icon-box icon-unlock"><Unlock size={16} /></div>;
    }
    return <div className="notif-icon-box icon-default"><Sparkles size={16} /></div>;
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return past.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="admin-notif-wrapper" ref={dropdownRef}>
      <button 
        className={`navbar-icon-btn notif-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title="Thông báo hệ thống"
        aria-label="Thông báo hệ thống"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="notif-badge-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown-panel animate-scale-in">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="notif-header-title">
              <h4>Thông báo hệ thống</h4>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} mới</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button 
                  className="notif-action-btn"
                  onClick={handleMarkAllAsRead}
                  title="Đánh dấu tất cả đã đọc"
                  disabled={loading}
                >
                  <CheckCheck size={16} />
                  <span>Đã đọc hết</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  className="notif-action-btn text-danger"
                  onClick={handleClearAll}
                  title="Xóa tất cả thông báo"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notif-tabs">
            <button 
              className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({notifications.length})
            </button>
            <button 
              className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="notif-dropdown-list">
            {displayedNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={36} color="#cbd5e1" />
                <p>Không có thông báo nào {filter === 'unread' ? 'chưa đọc' : ''}</p>
                <small>Hệ thống sẽ tự động cập nhật khi có học viên mới, thăng hạng hoặc khóa tài khoản.</small>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div 
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {getNotificationIcon(n.title)}
                  
                  <div className="notif-content">
                    <div className="notif-title-row">
                      <span className="notif-title">{n.title}</span>
                      {!n.isRead && <span className="notif-dot" />}
                    </div>
                    <p className="notif-body">{n.body}</p>
                    <div className="notif-meta">
                      <Clock size={12} />
                      <span>{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  <div className="notif-item-actions">
                    {!n.isRead && (
                      <button 
                        className="notif-item-btn" 
                        title="Đánh dấu đã đọc"
                        onClick={(e) => handleMarkAsRead(e, n.id)}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      className="notif-item-btn btn-delete" 
                      title="Xóa thông báo này"
                      onClick={(e) => handleDelete(e, n.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-dropdown-footer">
            <button 
              className="notif-footer-link"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/logs');
              }}
            >
              <span>Xem nhật ký hệ thống chi tiết</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
