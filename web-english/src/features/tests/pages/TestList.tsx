import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { fetchTests, createTest, updateTest, deleteTest } from '../api/test.api';
import './TestList.css';

const TestList: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [levelGroup, setLevelGroup] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ceftLevel: ''
  });

  const loadTests = async () => {
    setLoading(true);
    try {
      const res = await fetchTests(levelGroup, search);
      if (res.data) {
        setTests(res.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách bài thi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [levelGroup]); // Trigger reload when levelGroup changes
  
  // Also can debounce search or use a form submit for search. We'll keep it simple: press Enter or just type.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTests();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenModal = (test?: any) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        title: test.title || '',
        description: test.description || '',
        ceftLevel: test.ceftLevel || ''
      });
    } else {
      setEditingTest(null);
      setFormData({
        title: '',
        description: '',
        ceftLevel: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTest(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await updateTest(editingTest.id, formData);
        alert('Cập nhật bài thi thành công!');
      } else {
        await createTest(formData);
        alert('Tạo bài thi thành công!');
      }
      handleCloseModal();
      loadTests();
    } catch (error) {
      console.error("Lỗi khi lưu bài thi", error);
      alert('Có lỗi xảy ra khi lưu bài thi.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài thi này không?')) {
      try {
        await deleteTest(id);
        alert('Xóa bài thi thành công!');
        loadTests();
      } catch (error) {
        console.error("Lỗi xóa bài thi", error);
        alert('Có lỗi xảy ra khi xóa bài thi.');
      }
    }
  };

  const getLevelBadgeClass = (level: string) => {
    if (!level) return 'level-default';
    return `level-${level}`;
  };

  return (
    <AdminLayout>
      <div className="test-list-main">
        <div className="test-list-header">
          <h2>Quản lý bài kiểm tra</h2>
          <button className="add-test-btn" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Tạo bài thi mới
          </button>
        </div>

        <div className="test-filters">
          <input 
            type="text" 
            placeholder="Tìm kiếm bài thi..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="filter-select"
            value={levelGroup}
            onChange={(e) => setLevelGroup(e.target.value)}
          >
            <option value="">Tất cả nhóm cấp độ</option>
            <option value="A">Nhóm A (A1, A2)</option>
            <option value="B">Nhóm B (B1, B2)</option>
            <option value="C">Nhóm C (C1, C2)</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
        ) : (
          <div className="test-grid">
            {tests.length === 0 ? (
              <div style={{ padding: '24px', color: '#64748b' }}>Không tìm thấy bài thi nào.</div>
            ) : (
              tests.map(test => (
                <div className="test-card" key={test.id}>
                  <div className="test-card-header">
                    <span className={`test-level-badge ${getLevelBadgeClass(test.ceftLevel)}`}>
                      {test.ceftLevel || 'N/A'}
                    </span>
                    <div className="test-card-actions">
                      <button className="test-action-btn edit" onClick={() => handleOpenModal(test)}>
                        <Edit size={16} />
                      </button>
                      <button className="test-action-btn delete" onClick={() => handleDelete(test.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3>{test.title}</h3>
                  <p>{test.description || 'Chưa có mô tả'}</p>
                  
                  <div className="test-stats">
                    <span>Số câu hỏi: <strong>{test._count?.questions || 0}</strong></span>
                  </div>

                  <button 
                    className="test-manage-questions-btn"
                    onClick={() => navigate(`/admin/tests/${test.id}`)}
                  >
                    <BookOpen size={16} /> Quản lý câu hỏi
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTest ? 'Sửa bài thi' : 'Tạo bài thi mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tiêu đề Bài thi (*)</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="VD: Kiểm tra đầu vào A1"
                />
              </div>
              <div className="form-group">
                <label>Cấp độ CEFR</label>
                <select 
                  value={formData.ceftLevel}
                  onChange={(e) => setFormData({...formData, ceftLevel: e.target.value})}
                >
                  <option value="">Chọn cấp độ...</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả bài thi</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  placeholder="Mô tả tóm tắt nội dung kiểm tra..."
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingTest ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TestList;
