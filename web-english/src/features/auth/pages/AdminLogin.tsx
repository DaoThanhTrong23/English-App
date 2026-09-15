import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
        axios.post('http://localhost:3000/api/auth/facebook', {
          accessToken: accessToken,
          deviceInfo: "Trình duyệt Web"
        }).then(backendRes => {
          const resultData = backendRes.data.data;

          if (resultData?.user?.role !== 'admin') {
            setErrorMsg('Tài khoản Facebook này không có quyền quản trị!');
            setIsLoading(false);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          localStorage.setItem('adminToken', resultData.token.accessToken);
          localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
          navigate('/admin/dashboard');

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
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        identifier: identifier,
        password: password
      });

      const resultData = response.data.data;

      if (resultData?.user?.role !== 'admin') {
        setErrorMsg('Tài khoản này không có quyền truy cập trang quản trị!');
        setIsLoading(false);
        return;
      }

      const token = resultData?.token?.accessToken || resultData?.accessToken;
      if (token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
      }

      setTimeout(() => {
        navigate('/admin/dashboard');
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
                    placeholder="admin@example.com"
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
                        const response = await axios.post('http://localhost:3000/api/auth/google', {
                          idToken: idToken,
                          deviceInfo: "Trình duyệt Web"
                        });
                        const resultData = response.data.data;

                        if (resultData?.user?.role !== 'admin') {
                          setErrorMsg('Tài khoản Google này không có quyền quản trị!');
                          return;
                        }
                        localStorage.setItem('adminToken', resultData.token.accessToken);
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
                    href="https://www.facebook.com/v19.0/dialog/oauth?client_id=1417644583763676&redirect_uri=http://localhost:5173/admin/login&response_type=token&scope=email,public_profile"
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