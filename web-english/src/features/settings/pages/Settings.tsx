import React, { useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { changePassword } from '../api/settings.api';
import { Lock, User, Palette } from 'lucide-react';
import '../../courses/pages/CourseList.css'; // Reuse container styles

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance'>('profile');
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Appearance state
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'light');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await changePassword(oldPassword, newPassword);
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu' });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('admin_theme', newTheme);
    // Real implementation would toggle a class on document.body here
    setMessage({ type: 'success', text: 'Đã lưu cấu hình giao diện. Sẽ áp dụng ở phiên bản sau.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="course-list-header">
            <h2>Cài đặt Hệ thống</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #3b82f6' : 'none', color: activeTab === 'profile' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} style={{ display: 'inline', marginRight: '8px' }}/> Hồ sơ cá nhân
            </button>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'appearance' ? '2px solid #3b82f6' : 'none', color: activeTab === 'appearance' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={16} style={{ display: 'inline', marginRight: '8px' }}/> Giao diện
            </button>
          </div>

          {activeTab === 'profile' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={20} /> Đổi mật khẩu Admin
                </h3>
                
                {message.text && (
                  <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#ef4444' : '#22c55e' }}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{ marginTop: '10px', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Chế độ hiển thị (Sắp ra mắt)</h3>
                
                {message.text && (
                  <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#ef4444' : '#22c55e' }}>
                    {message.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div 
                    onClick={() => handleThemeChange('light')}
                    style={{ flex: 1, padding: '20px', border: theme === 'light' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: 'white' }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>☀️</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Giao diện Sáng</div>
                  </div>
                  <div 
                    onClick={() => handleThemeChange('dark')}
                    style={{ flex: 1, padding: '20px', border: theme === 'dark' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: '#1e293b' }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌙</div>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>Giao diện Tối</div>
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '20px' }}>
                  * Lưu ý: Hiện tại ứng dụng đang tập trung hoàn thiện tính năng cốt lõi. Chế độ Dark mode sẽ được áp dụng đồng bộ toàn hệ thống trong các phiên bản cập nhật tới.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
