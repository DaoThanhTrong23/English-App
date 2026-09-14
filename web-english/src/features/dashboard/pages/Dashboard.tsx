import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTotalStudents } from '../../students/api/student.api';
import {getTotalWord} from '../../words/api/words.api'

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [totalStudents, setTotalStudents] = useState<number | string>('...');
  const [totalWords, setTotalWord] = useState<number | string>('...');
  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const count = await getTotalStudents();
  //       setTotalStudents(count);
  //     } catch (error) {
  //       setTotalStudents('Lỗi');
  //       console.error("Không lấy được số lượng", error);
  //     }
  //   };


  //   fetchStats();
  // }, []);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const count1 = await getTotalStudents();
        setTotalStudents(count1);
        
        const count2 = await getTotalWord();
        setTotalWord(count2);

      } catch (error) {
        setTotalStudents('Lỗi');
        setTotalWord('Lỗi');
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };


  const styles = {
    container: { display: 'flex', flexDirection: 'column' as const, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9fafb' },
    // THANH NAVBAR
    navbar: { 
      backgroundColor: '#ffffff', 
      color: '#111827', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 30px',
      height: '64px',
      borderBottom: '1px solid #e5e7eb',
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
    logo: { fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' },
    menu: { display: 'flex', gap: '8px' },
    menuItem: { 
      padding: '8px 16px', 
      cursor: 'pointer', 
      borderRadius: '6px', 
      fontWeight: '500', 
      fontSize: '0.95rem',
      color: '#4b5563',
      transition: 'background 0.2s',
    },
    menuItemActive: {
      padding: '8px 16px', 
      cursor: 'pointer', 
      borderRadius: '6px', 
      fontWeight: '600', 
      fontSize: '0.95rem',
      backgroundColor: '#f3f4f6',
      color: '#111827'
    },
    navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
    greeting: { fontSize: '0.95rem', color: '#4b5563' },
    logoutBtn: { backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem', transition: 'all 0.2s' },
    
    // NỘI DUNG CHÍNH
    mainContent: { flex: 1, padding: '40px' },
    pageTitle: { margin: '0 0 24px 0', color: '#111827', fontSize: '1.5rem', fontWeight: '600' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
    card: { 
      backgroundColor: 'white', 
      padding: '24px', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb',
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'flex-start'
    },
    cardTitle: { fontSize: '0.9rem', color: '#6b7280', fontWeight: '500', marginBottom: '12px' },
    cardValue: { fontSize: '2rem', fontWeight: '700', color: '#111827', margin: 0 },
  };

  return (
    <div style={styles.container}>
      {/* THANH NAVBAR */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>EnglishApp</div>
          <div style={styles.menu}>
            <div style={styles.menuItemActive}>Tổng quan</div>
            <div style={styles.menuItem} onClick={() => navigate('/admin/students')}>Học viên</div>
            <div style={styles.menuItem}>Bài học</div>
            <div style={styles.menuItem}>Từ vựng</div>
          </div>
        </div>

        <div style={styles.navRight}>
          <span style={styles.greeting}>Xin chào, <b>Admin</b></span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
        </div>
      </div>

      {/* NỘI DUNG TRANG */}
      <div style={styles.mainContent}>
        <h2 style={styles.pageTitle}>Bảng Thống Kê</h2>
        
        <div style={styles.cardGrid}>
          <div style={styles.card}>
            <span style={styles.cardTitle}>Tổng học viên</span>
            <h3 style={styles.cardValue}>{totalStudents}</h3>
          </div>
          <div style={styles.card}>
            <span style={styles.cardTitle}>Tổng bài học</span>
            <h3 style={styles.cardValue}>48</h3>
          </div>
          <div style={styles.card}>
            <span style={styles.cardTitle}>Tổng từ vựng</span>
            <h3 style={styles.cardValue}>{totalWords}</h3>
          </div>
          <div style={styles.card}>
            <span style={styles.cardTitle}>Điểm đánh giá</span>
            <h3 style={styles.cardValue}>4.8</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
