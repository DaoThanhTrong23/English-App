import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hello: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Xóa thẻ bài (Token)
    navigate('/admin/login'); // Đá về trang Đăng nhập
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h1>Hẻ lô</h1>
      <button 
        onClick={handleLogout}
        style={{ padding: '10px 20px', marginTop: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Đăng Xuất
      </button>
    </div>
  );
};

export default Hello;