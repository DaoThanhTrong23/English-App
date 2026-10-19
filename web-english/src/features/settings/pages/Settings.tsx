import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { changePassword } from '../api/settings.api';
import { Lock, User, Info } from 'lucide-react';
import '../../courses/pages/CourseList.css'; // Reuse container styles

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'info' ? 'info' : 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'info'>(initialTab);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải dài ít nhất 8 ký tự!' });
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[\W_]/.test(newPassword)) {
      setMessage({ 
        type: 'error', 
        text: 'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt!' 
      });
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

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="course-list-header">
            <h2>Cài đặt hệ thống</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #3b82f6' : 'none', color: activeTab === 'profile' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('profile'); setSearchParams({ tab: 'profile' }); }}
            >
              <User size={16} style={{ display: 'inline', marginRight: '8px' }}/> Hồ sơ cá nhân
            </button>
            <button 
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : 'none', color: activeTab === 'info' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
              onClick={() => { setActiveTab('info'); setSearchParams({ tab: 'info' }); }}
            >
              <Info size={16} style={{ display: 'inline', marginRight: '8px' }}/> Thông tin ứng dụng
            </button>
          </div>

          {activeTab === 'profile' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', width: '100%' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={20} /> Đổi mật khẩu Admin
                </h3>
                
                {message.text && (
                  <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#ef4444' : '#22c55e' }}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      style={{ width: '95%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      style={{ width: '95%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <small style={{ display: 'block', marginTop: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                      Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </small>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      style={{ width: '95%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
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

          {activeTab === 'info' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={20} /> Giới thiệu ứng dụng
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Tên ứng dụng</span>
                    <span style={{ color: '#1e293b', fontWeight: 'bold' }}>EnglishApp</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Phiên bản (Version)</span>
                    <span style={{ color: '#1e293b', fontWeight: 'bold' }}>v1.0.0</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Môi trường</span>
                    <span style={{ color: '#1e293b' }}>Production</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Bản quyền</span>
                    <span style={{ color: '#1e293b' }}>© 2026 Mấy con gà :).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
