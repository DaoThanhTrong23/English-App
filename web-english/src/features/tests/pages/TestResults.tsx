import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { ArrowLeft } from 'lucide-react';
import { axiosClient } from '../../../config/axios';
import './TestList.css';

const TestResults: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testInfo, setTestInfo] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/admin/tests/${testId}/results`);
        if (res.data) {
          setResults(res.data.data.results);
          setTestInfo(res.data.data.test);
        }
      } catch (error) {
        console.error("Lỗi tải kết quả", error);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchResults();
  }, [testId]);

  return (
    <AdminLayout>
      <div className="test-list-main">
        <button className="test-manage-questions-btn" style={{ width: 'fit-content', marginBottom: '20px' }} onClick={() => navigate('/admin/tests')}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        <div className="test-list-header">
          <h2>Kết quả thi: {testInfo?.title || `Bài thi #${testId}`}</h2>
        </div>

        <div className="test-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>Đang tải...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên Học Viên</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Điểm Số</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ngày Thi</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Chưa có học viên nào làm bài thi này.</td>
                  </tr>
                ) : (
                  results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px' }}><strong>{r.user.username}</strong></td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.user.email}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{r.totalScore}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{new Date(r.completedAt).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestResults;
