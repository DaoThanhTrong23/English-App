import React, { useState, useEffect } from 'react';
import { axiosClient } from '../../../config/axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import './AdminLogin.css';
import mascotGif from '../../../assets/images/gacon.gif';
const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');

      if (accessToken) {
        setIsLoading(true);
        axiosClient.post('/auth/facebook', {
          accessToken: accessToken,
          deviceInfo: "Trình duyệt Web"
        }).then(backendRes => {
          const resultData = backendRes.data.data;

          if (String(resultData?.user?.role || '').toLowerCase() === 'user') {
            setErrorMsg('Tài khoản học viên không có quyền truy cập trang quản trị!');
            setIsLoading(false);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          const accessToken = resultData?.token?.accessToken || resultData?.accessToken;
          const refreshToken = resultData?.token?.refreshToken || resultData?.refreshToken;

          if (accessToken) {
            localStorage.setItem('adminToken', accessToken);
          }
          if (refreshToken) {
            localStorage.setItem('adminRefreshToken', refreshToken);
          }
          const getRedirectPath = (u: any) => {
            const isAdmin = u?.role?.toLowerCase() === 'admin';
            const perms: string[] = u?.permissions || [];
            if (isAdmin || perms.includes('READ_DASHBOARD_STATS')) return '/admin/dashboard';
            if (perms.includes('READ_STUDENT_LIST')) return '/admin/students';
            if (perms.includes('READ_TOPIC_LIST')) return '/admin/topics';
            if (perms.includes('READ_COURSE_LIST')) return '/admin/courses';
            if (perms.includes('READ_WORD_LIST')) return '/admin/words';
            if (perms.includes('READ_TEST_LIST')) return '/admin/tests';
            if (perms.includes('READ_ACHIEVEMENT_LIST')) return '/admin/achievements';
            if (perms.includes('READ_KEYWORD_SETTING_LIST')) return '/admin/keywords';
            if (perms.includes('READ_ROLE_LIST')) return '/admin/staff';
            if (perms.includes('READ_AI_ADMIN_SESSIONS') || perms.includes('READ_AI_ADMIN_STATS')) return '/admin/ai-chat';
            if (perms.includes('READ_GAME_SETTING_LIST')) return '/admin/game';
            if (perms.includes('READ_TOPIC_SETTING_LIST')) return '/admin/topic-levels';
            if (perms.includes('READ_ACTIVITY_LOG_LIST')) return '/admin/logs';
            return '/admin/settings';
          };

          localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
          navigate(getRedirectPath(resultData.user));

        }).catch(error => {
          setErrorMsg(error?.response?.data?.error?.message || "Lỗi xác thực từ Server");
          setIsLoading(false);
          window.history.replaceState(null, '', window.location.pathname);
        });
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axiosClient.post('/auth/login', {
        identifier: identifier,
        password: password
      });

      const resultData = response.data.data;

      if (resultData?.user?.role === 'user') {
        setErrorMsg('Tài khoản này không có quyền truy cập trang quản trị!');
        setIsLoading(false);
        return;
      }

      const token = resultData?.token?.accessToken || resultData?.accessToken;
      const refreshToken = resultData?.token?.refreshToken || resultData?.refreshToken;

      if (token) {
        localStorage.setItem('adminToken', token);
      }
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
      localStorage.setItem('adminInfo', JSON.stringify(resultData.user));

      const u = resultData.user;
      const isAdmin = u?.role?.toLowerCase() === 'admin';
      const perms: string[] = u?.permissions || [];
      let redirectPath = '/admin/dashboard';
      if (!isAdmin && !perms.includes('READ_DASHBOARD_STATS')) {
        if (perms.includes('READ_STUDENT_LIST')) redirectPath = '/admin/students';
        else if (perms.includes('READ_TOPIC_LIST')) redirectPath = '/admin/topics';
        else if (perms.includes('READ_COURSE_LIST')) redirectPath = '/admin/courses';
        else if (perms.includes('READ_WORD_LIST')) redirectPath = '/admin/words';
        else if (perms.includes('READ_TEST_LIST')) redirectPath = '/admin/tests';
        else if (perms.includes('READ_ACHIEVEMENT_LIST')) redirectPath = '/admin/achievements';
        else if (perms.includes('READ_KEYWORD_SETTING_LIST')) redirectPath = '/admin/keywords';
        else if (perms.includes('READ_ROLE_LIST')) redirectPath = '/admin/staff';
        else if (perms.includes('READ_AI_ADMIN_SESSIONS') || perms.includes('READ_AI_ADMIN_STATS')) redirectPath = '/admin/ai-chat';
        else if (perms.includes('READ_GAME_SETTING_LIST')) redirectPath = '/admin/game';
        else if (perms.includes('READ_TOPIC_SETTING_LIST')) redirectPath = '/admin/topic-levels';
        else if (perms.includes('READ_ACTIVITY_LOG_LIST')) redirectPath = '/admin/logs';
        else redirectPath = '/admin/settings';
      }

      setTimeout(() => {
        navigate(redirectPath);
      }, 500);

    } catch (error: any) {
      console.error('Lỗi hệ thống:', error);
      const message = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc kết nối!';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">

        <div className="admin-login-welcome">

          <h1>Xin chào!</h1>
          <br />
          <p>Chào mừng đã đến với ứng dụng học tiếng anh</p>

          <div style={{ marginTop: '30px' }}>
            <img
              src={mascotGif}
              alt="Gà Con Mascot"
              style={{
                width: '180px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.2))'
              }}
            />
          </div>
        </div>

        <div className="admin-login-form-section">
          <GoogleOAuthProvider clientId="774080954802-jub4qqvp4eijmk5b04367fk4164omjk5.apps.googleusercontent.com">
            <div className="admin-login-card">
              <div className="admin-login-header">
                <h2 className="admin-login-title">Đăng nhập</h2>
              </div>

              {errorMsg && (
                <div className="admin-login-error">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="admin-login-form">
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Email hoặc Username</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="admin-login-input"
                    placeholder="Nhập email hoặc username"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="admin-login-input"
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="admin-login-button"
                  style={{ backgroundColor: isLoading ? '#9ca3af' : '#2563eb' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
                </button>

                <div className="admin-login-divider">
                  — hoặc —
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    width="300"
                    onSuccess={async (credentialResponse) => {
                      try {
                        setErrorMsg('');
                        const idToken = credentialResponse.credential;
                        const response = await axiosClient.post('/auth/google', {
                          idToken: idToken,
                          deviceInfo: "Trình duyệt Web"
                        });
                        const resultData = response.data.data;

          if (String(resultData?.user?.role || '').toLowerCase() === 'user') {
            setErrorMsg('Tài khoản học viên không có quyền truy cập trang quản trị!');
                          return;
                        }
                        const token = resultData?.token?.accessToken || resultData?.accessToken;
                        const refreshToken = resultData?.token?.refreshToken || resultData?.refreshToken;

                        if (token) {
                          localStorage.setItem('adminToken', token);
                        }
                        if (refreshToken) {
                          localStorage.setItem('adminRefreshToken', refreshToken);
                        }
                        localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
                        navigate('/admin/dashboard');
                      } catch (error: any) {
                        setErrorMsg(error.response?.data?.error?.message || "Lỗi xác thực từ Server");
                      }
                    }}
                    onError={() => {
                      setErrorMsg("Cửa sổ đăng nhập Google bị đóng hoặc gặp lỗi.");
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                  <a
                    href={`https://www.facebook.com/v19.0/dialog/oauth?client_id=1417644583763676&redirect_uri=${encodeURIComponent(window.location.origin + '/admin/login')}&response_type=token&scope=email,public_profile`}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '40px',
                      background: '#1877F2',
                      color: 'white',
                      textDecoration: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      width: '100%',
                      boxSizing: 'border-box',
                      fontFamily: 'system-ui, sans-serif'
                    }}
                  >
                    Đăng nhập bằng Facebook
                  </a>
                </div>
              </form>
            </div>
          </GoogleOAuthProvider>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;