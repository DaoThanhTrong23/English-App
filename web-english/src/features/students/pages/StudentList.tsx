import React, { useState, useEffect } from 'react';

import { getStudents, getStudentDetail, fetchStudentProgress, fetchStudentAiChat, updateStudentLockStatus } from '../api/student.api';
import type { Student, StudentDetailResponse } from '../types/student.types';
import './StudentList.css';
import '../../words/pages/WordList.css'; // For Dashboard Layout styles

import AdminLayout from '../../../components/layout/AdminLayout';
import { Lock, Unlock, CheckCircle2, Eye, X } from 'lucide-react';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailResponse['data'] | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'progress' | 'chat'>('tests');
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [studentChat, setStudentChat] = useState<any[]>([]);

  const handleToggleLock = async (studentId: number, currentLocked: boolean, username: string) => {
    const confirmMsg = currentLocked 
      ? `Bạn có chắc chắn muốn MỞ KHÓA tài khoản cho học viên "${username}" không? Học viên sẽ có thể đăng nhập lại vào ứng dụng.`
      : `Bạn có chắc chắn muốn KHÓA tài khoản học viên "${username}" không? Học viên sẽ bị đăng xuất ngay và không thể đăng nhập.`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await updateStudentLockStatus(studentId, !currentLocked);
      if (res.success) {
        alert(res.message);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isLocked: !currentLocked } : s));
        if (selectedStudent && selectedStudent.profile.id === studentId) {
          setSelectedStudent({
            ...selectedStudent,
            profile: { ...selectedStudent.profile, isLocked: !currentLocked } as any
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };
  

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents({ page, limit, search: debouncedSearch });
      if (res.success) {
        setStudents(res.data.items);
        setTotal(res.data.pagination.totalItems);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách học viên", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, debouncedSearch]);

  const handleViewDetail = async (id: number) => {
    try {
      setActiveTab('tests');
      const res = await getStudentDetail(id);
      if (res.success) {
        setSelectedStudent(res.data);
      }
      const pRes = await fetchStudentProgress(id);
      if (pRes.success) setStudentProgress(pRes.data);
      
      const cRes = await fetchStudentAiChat(id);
      if (cRes.success) setStudentChat(cRes.data);
    } catch (error) {
      alert("Lỗi tải chi tiết học viên");
    }
  };

  return (
    <AdminLayout>
      <div className="student-list-container">
        <div className="student-list-header">
          <h2 className="student-list-title">Quản lý học viên</h2>
        </div>

        <div className="student-list-controls">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc email..." 
            className="student-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="student-table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
          ) : (
            <>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Trạng thái</th>
                    <th>Hoạt động cuối</th>
                    <th>Tiến độ từ vựng</th>
                    <th>Điểm XP</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(st => (
                    <tr key={st.id}>
                      <td>
                        <div className="student-info-cell">
                          <div className="student-avatar">{st.username.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="student-name">{st.username}</div>
                            <div className="student-email">{st.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {st.isLocked ? (
                          <span style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626', 
                            padding: '4px 10px', 
                            borderRadius: '16px', 
                            fontSize: '0.8rem', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Lock size={13} /> Đã khóa
                          </span>
                        ) : (
                          <span style={{ 
                            backgroundColor: '#dcfce7', 
                            color: '#16a34a', 
                            padding: '4px 10px', 
                            borderRadius: '16px', 
                            fontSize: '0.8rem', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={13} /> Hoạt động
                          </span>
                        )}
                      </td>
                      <td>
                        {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleString('vi-VN') : 'Chưa có'}
                      </td>
                      <td>
                        <div className="progress-stats">
                          <span className="stat-badge learning" title="Đang học">
                            {st.progress.learningWords}
                          </span>
                          <span className="stat-badge mastered" title="Đã thuộc">
                            {st.progress.masteredWords}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#eab308' }}>{st.xpPoints} XP</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="view-btn" onClick={() => handleViewDetail(st.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} /> Xem chi tiết
                          </button>
                          {st.isLocked ? (
                            <button 
                              style={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => handleToggleLock(st.id, true, st.username)}
                              title="Mở khóa tài khoản học viên"
                            >
                              <Unlock size={14} /> Mở khóa
                            </button>
                          ) : (
                            <button 
                              style={{
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => handleToggleLock(st.id, false, st.username)}
                              title="Khóa tài khoản học viên"
                            >
                              <Lock size={14} /> Khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Không tìm thấy học viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="page-btn" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                  <span className="page-info">Trang {page} / {totalPages} (Tổng: {total})</span>
                  <button 
                    className="page-btn" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Chi tiết */}
        {selectedStudent && (
          <div className="student-modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="student-modal-content" onClick={e => e.stopPropagation()}>
              <div className="student-modal-header" style={{ display: 'flex', alignItems: 'center' }}>
                <h3>Chi tiết học viên: {selectedStudent.profile.username}</h3>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
                  {selectedStudent.profile.isLocked ? (
                    <button
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleToggleLock(selectedStudent.profile.id, true, selectedStudent.profile.username)}
                    >
                      <Unlock size={16} /> Mở khóa tài khoản
                    </button>
                  ) : (
                    <button
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleToggleLock(selectedStudent.profile.id, false, selectedStudent.profile.username)}
                    >
                      <Lock size={16} /> Khóa tài khoản
                    </button>
                  )}
                </div>
                <button className="close-btn" onClick={() => setSelectedStudent(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="student-details-grid">
                <div className="detail-card">
                  <h4>Thông tin cá nhân</h4>
                  <div className="detail-row">
                    <span className="detail-label">Trạng thái:</span>
                    <span className="detail-value">
                      {selectedStudent.profile.isLocked ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={14} /> Đã khóa tài khoản
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Đang hoạt động
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedStudent.profile.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Điểm XP:</span>
                    <span className="detail-value" style={{color: '#eab308'}}>{selectedStudent.profile.xpPoints}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ngày tham gia:</span>
                    <span className="detail-value">{new Date(selectedStudent.profile.joinedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Lần đăng nhập cuối:</span>
                    <span className="detail-value">
                      {selectedStudent.profile.lastLoginDate ? new Date(selectedStudent.profile.lastLoginDate).toLocaleString('vi-VN') : 'Chưa có'}
                    </span>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>Tổng quan tiến trình</h4>
                  <div className="detail-row">
                    <span className="detail-label">Đang học:</span>
                    <span className="detail-value" style={{color: '#3b82f6'}}>{selectedStudent.progressSummary.learningWords} từ</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Đã thuộc:</span>
                    <span className="detail-value" style={{color: '#16a34a'}}>{selectedStudent.progressSummary.masteredWords} từ</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Bài kiểm tra đã làm:</span>
                    <span className="detail-value">{selectedStudent.progressSummary.testsCompleted} bài</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Điểm KT trung bình:</span>
                    <span className="detail-value">{selectedStudent.progressSummary.averageTestScore} / 100</span>
                  </div>
                </div>

                <div className="detail-card" style={{ gridColumn: '1 / -1' }}>
                  <h4>Đánh giá năng lực FAME-KT & Trình độ</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Trình độ CEFR</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>{selectedStudent.profile.cefrLevel || 'Chưa đánh giá'}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Elo Ngữ pháp</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{selectedStudent.profile.grammarElo ?? 1200}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Elo Từ vựng</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{selectedStudent.profile.vocabElo ?? 1200}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Elo Đọc hiểu</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>{selectedStudent.profile.readingElo ?? 1200}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Elo Nghe hiểu</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#06b6d4' }}>{selectedStudent.profile.listeningElo ?? 1200}</div>
                    </div>
                  </div>
                  {selectedStudent.profile.preferredTopics && (
                    <div className="detail-row" style={{ marginTop: '12px' }}>
                      <span className="detail-label">Chủ đề quan tâm:</span>
                      <span className="detail-value">{selectedStudent.profile.preferredTopics}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedStudent.achievements.length > 0 && (
                <div className="detail-card" style={{ marginTop: '24px' }}>
                  <h4>Thành tựu đã đạt ({selectedStudent.progressSummary.achievementsUnlocked})</h4>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {selectedStudent.achievements.map((ach, idx) => (
                      <div key={idx} style={{ textAlign: 'center', width: '100px' }}>
                        {ach.iconUrl && <img src={ach.iconUrl} alt={ach.title} style={{ width: '40px', height: '40px' }} />}
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', color: '#1e293b' }}>{ach.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ach.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px', borderBottom: '2px solid #e2e8f0' }}>
                <button 
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'tests' ? '2px solid #3b82f6' : 'none', color: activeTab === 'tests' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
                  onClick={() => setActiveTab('tests')}
                >Bài thi</button>
                <button 
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'progress' ? '2px solid #3b82f6' : 'none', color: activeTab === 'progress' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
                  onClick={() => setActiveTab('progress')}
                >Tiến độ học</button>
                <button 
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #3b82f6' : 'none', color: activeTab === 'chat' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', marginBottom: '-2px' }}
                  onClick={() => setActiveTab('chat')}
                >Lịch sử Chat AI</button>
              </div>

              {activeTab === 'tests' && selectedStudent.recentTests.length > 0 && (
                <div className="detail-card" style={{ marginTop: '16px' }}>
                  <h4>Lịch sử kiểm tra gần đây</h4>
                  <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Bài thi (ID)</th>
                        <th style={{ padding: '8px' }}>Điểm số</th>
                        <th style={{ padding: '8px' }}>Thời gian hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.recentTests.map((rt, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px' }}>{rt.testId}</td>
                          <td style={{ padding: '8px', fontWeight: 600, color: rt.totalScore >= 50 ? '#16a34a' : '#dc2626' }}>
                            {rt.totalScore}
                          </td>
                          <td style={{ padding: '8px', color: '#64748b' }}>{new Date(rt.completedAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="detail-card" style={{ marginTop: '16px' }}>
                  <h4>Tiến độ học từ vựng</h4>
                  {studentProgress.length === 0 ? <p>Chưa có dữ liệu</p> : (
                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Từ vựng</th>
                          <th style={{ padding: '8px' }}>Trạng thái</th>
                          <th style={{ padding: '8px' }}>Mức độ nhớ</th>
                          <th style={{ padding: '8px' }}>Lần ôn tới</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentProgress.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.word?.word}</td>
                            <td style={{ padding: '8px' }}>{p.status}</td>
                            <td style={{ padding: '8px' }}>Level {p.memoryLevel}</td>
                            <td style={{ padding: '8px', color: '#64748b' }}>{p.nextReviewDate ? new Date(p.nextReviewDate).toLocaleDateString('vi-VN') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="detail-card" style={{ marginTop: '16px' }}>
                  <h4>Lịch sử trò chuyện với AI</h4>
                  {studentChat.length === 0 ? <p>Chưa có dữ liệu chat</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {studentChat.map((session, idx) => (
                        <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            Cuộc trò chuyện ngày {new Date(session.startedAt).toLocaleString('vi-VN')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {session.messages.map((msg: any, mIdx: number) => (
                              <div key={mIdx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#eff6ff' : '#f1f5f9', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%' }}>
                                <div style={{ fontSize: '0.9rem' }}>{msg.messageText}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StudentList;
