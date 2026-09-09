import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Để hiển thị lỗi màu đỏ trên form
  
  const navigate = useNavigate(); // Công cụ dùng để chuyển trang của React Router

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(''); // Xóa lỗi cũ khi bấm lại
    
    try {
      // 1. Gửi dữ liệu Đăng nhập xuống Backend (đã dùng đúng biến identifier)
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        identifier: identifier, 
        password: password
      });
      
      const resultData = response.data.data; 
      
      // 2. Kiểm tra tài khoản có phải là Admin không (nếu bạn muốn chặn User thường)
      if (resultData?.user?.role !== 'admin') {
         setErrorMsg('Tài khoản này không có quyền truy cập trang quản trị!');
         setIsLoading(false);
         return;
      }

      // 3. Lấy và Lưu Token vào LocalStorage để đi các cửa khác không bị chặn
      const token = resultData?.token?.accessToken || resultData?.accessToken;
      if (token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminInfo', JSON.stringify(resultData.user));
      }
      
      // 4. Chuyển hướng thẳng vào trang Quản lý sau 0.5s để tạo cảm giác mượt mà
      // Chuyển hướng thẳng vào trang Hello sau 0.5s
      setTimeout(() => {
        navigate('/hello'); // ĐỔI THÀNH /hello Ở ĐÂY
      }, 500);
      
    } catch (error: any) {
      console.error('Lỗi hệ thống:', error);
      // Lấy câu chửi lỗi từ Backend (Lỗi 401 hoặc 422 từ Zod)
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
      <div style={styles.card}>
        {/* Tiêu đề */}
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Login</h2>
          <p style={styles.subtitle}>Hệ thống Quản trị English App</p>
        </div>
        
        {/* Hiện khung thông báo lỗi nếu có */}
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
            style={{...styles.button, backgroundColor: isLoading ? '#9ca3af' : '#2563eb'}}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

// CSS inline cực xịn
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif'
  },
  card: {
    backgroundColor: 'white', padding: '40px', borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '380px',
  },
  header: { marginBottom: '25px', textAlign: 'center' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#111827', fontWeight: 'bold' },
  subtitle: { margin: '0', fontSize: '14px', color: '#6b7280' },
  errorBox: {
    backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', 
    borderRadius: '6px', fontSize: '14px', marginBottom: '20px', textAlign: 'center',
    border: '1px solid #f87171'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '12px 14px', fontSize: '15px', border: '1px solid #d1d5db',
    borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px', color: 'white', fontSize: '16px', fontWeight: 'bold',
    border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px',
    transition: 'background-color 0.2s'
  }
};

export default AdminLogin;