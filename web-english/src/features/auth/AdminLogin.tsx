import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  // --- HÀM TỰ ĐỘNG BẮT TOKEN KHI FACEBOOK CHUYỂN HƯỚNG VỀ ---
  useEffect(() => {
    // Kiểm tra xem trên thanh địa chỉ có mã access_token của FB không
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1)); // Bỏ dấu #
      const accessToken = params.get('access_token');

      if (accessToken) {
        setIsLoading(true);
        // Gửi token xuống Backend
        axios.post('http://localhost:3000/api/auth/facebook', {
          accessToken: accessToken,
          deviceInfo: "Trình duyệt Web"
        }).then(backendRes => {
          const resultData = backendRes.data.data;

          if (resultData?.user?.role !== 'admin') {
            setErrorMsg('Tài khoản Facebook này không có quyền quản trị!');
            setIsLoading(false);
            window.history.replaceState(null, '', window.location.pathname); // Xóa token trên URL cho sạch
            return;
          }

          localStorage.setItem('adminToken', resultData.token.accessToken);
          localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
          navigate('/hello');

        }).catch(error => {
          setErrorMsg(error?.response?.data?.error?.message || "Lỗi xác thực từ Server");
          setIsLoading(false);
          window.history.replaceState(null, '', window.location.pathname); // Xóa token trên URL
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
        navigate('/hello');
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
    <div style={styles.container}>
      <GoogleOAuthProvider clientId="774080954802-jub4qqvp4eijmk5b04367fk4164omjk5.apps.googleusercontent.com">
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>Admin Login</h2>
            <p style={styles.subtitle}>Hệ thống Quản trị English App</p>
          </div>

          {errorMsg && (
            <div style={styles.errorBox}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email hoặc Username</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                placeholder="admin@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              style={{ ...styles.button, backgroundColor: isLoading ? '#9ca3af' : '#2563eb' }}
              disabled={isLoading}
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>

            <div style={{ textAlign: 'center', margin: '15px 0', color: '#9ca3af', fontSize: '14px' }}>
              — hoặc —
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
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
                    navigate('/hello');
                  } catch (error: any) {
                    setErrorMsg(error.response?.data?.error?.message || "Lỗi xác thực từ Server");
                  }
                }}
                onError={() => {
                  setErrorMsg("Cửa sổ đăng nhập Google bị đóng hoặc gặp lỗi.");
                }}
              />
            </div>

            {/* --- NÚT ĐĂNG NHẬP FACEBOOK CHUYỂN TRANG CHẮC CHẮN 100% THÀNH CÔNG --- */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <a
                href="https://www.facebook.com/v19.0/dialog/oauth?client_id=1417644583763676&redirect_uri=http://localhost:5173/admin/login&response_type=token&scope=email,public_profile"
                style={{ padding: '10px 20px', background: '#1877F2', color: 'white', textDecoration: 'none', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
              >
                Đăng nhập bằng Facebook
              </a>
            </div>

          </form>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '380px' },
  header: { marginBottom: '25px', textAlign: 'center' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#111827', fontWeight: 'bold' },
  subtitle: { margin: '0', fontSize: '14px', color: '#6b7280' },
  errorBox: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', textAlign: 'center', border: '1px solid #f87171' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: { padding: '12px 14px', fontSize: '15px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s' },
  button: { padding: '14px', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s' },
};

export default AdminLogin;