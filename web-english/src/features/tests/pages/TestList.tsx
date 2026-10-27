import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, BookOpen, Eye, BarChart2, Sparkles, HelpCircle, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchTests, createTest, updateTest, deleteTest } from '../api/test.api';
import { useToast } from '../../../context/ToastContext';
import './TestList.css';

const TestList: React.FC = () => {
  const navigate = useNavigate();
  const { toast, confirmModal } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters & Tabs
  const [search, setSearch] = useState('');
  const [levelGroup, setLevelGroup] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'placement' | 'lesson'>('placement');

  // Server-side Pagination states
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9; // 9 bài thi mỗi trang (3x3 card grid)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1
  });
  const [tabCounts, setTabCounts] = useState({
    placement: 5,
    lesson: 0,
    all: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ceftLevel: ''
  });

  const loadTests = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetchTests({
        page: targetPage,
        limit: PAGE_SIZE,
        ceftLevel: levelGroup || undefined,
        search: search.trim() || undefined,
        type: activeTab
      });

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          setTests(res.data);
          setPagination({
            total: res.data.length,
            page: 1,
            limit: PAGE_SIZE,
            totalPages: Math.ceil(res.data.length / PAGE_SIZE)
          });
        } else if (res.data.items) {
          setTests(res.data.items);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
          if (res.data.counts) {
            setTabCounts(res.data.counts);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi tải danh sách bài thi", error);
      toast.error('Không thể tải danh sách bài thi.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search / filter change resets page to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadTests(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [levelGroup, search, activeTab]);

  // Handle page change directly
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page) return;
    setPage(newPage);
    loadTests(newPage);
  };

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
        toast.success('Cập nhật bài thi thành công!');
      } else {
        await createTest(formData);
        toast.success('Tạo bài thi thành công!');
      }
      handleCloseModal();
      loadTests(page);
    } catch (error) {
      console.error("Lỗi khi lưu bài thi", error);
      toast.error('Có lỗi xảy ra khi lưu bài thi.');
    }
  };

  const handleDelete = (id: number) => {
    confirmModal({
      title: 'Xóa bài thi',
      message: 'Bạn có chắc chắn muốn xóa bài thi này không? Tất cả các câu hỏi và kết quả thi liên quan cũng sẽ bị ảnh hưởng.',
      confirmText: 'Xóa bài thi',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTest(id);
          toast.success('Xóa bài thi thành công!');
          loadTests(page);
        } catch (error) {
          console.error("Lỗi xóa bài thi", error);
          toast.error('Có lỗi xảy ra khi xóa bài thi.');
        }
      }
    });
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

        {/* TABS PHÂN LOẠI ĐỀ THI TRÊN SERVER */}
        <div className="test-category-tabs">
          <button 
            className={`test-category-tab ${activeTab === 'placement' ? 'active' : ''}`}
            onClick={() => setActiveTab('placement')}
          >
             Đề kiểm tra đầu vào
            <span className="tab-count-badge">{tabCounts.placement} đề</span>
          </button>
          <button 
            className={`test-category-tab ${activeTab === 'lesson' ? 'active' : ''}`}
            onClick={() => setActiveTab('lesson')}
          >
            <BookOpen size={16} /> Bài tập theo bài học
            <span className="tab-count-badge">{tabCounts.lesson}</span>
          </button>
          <button 
            className={`test-category-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <HelpCircle size={16} /> Tất cả bài thi
            <span className="tab-count-badge">{tabCounts.all}</span>
          </button>
        </div>

        {activeTab === 'placement' && (
          <div className="placement-info-banner">
            <div className="banner-text">
              <h4>Ngân hàng câu hỏi bài kiểm tra phân loại đầu vào</h4>
              <p>
                Bộ 100 câu hỏi chuẩn hóa qua 4 kỹ năng (Ngữ pháp, Từ vựng, Đọc hiểu, Nghe) trải dài từ A1 đến C1.
                Admin có thể bấm <strong>"Xem chi tiết"</strong> ở từng cấp độ để xem danh sách câu hỏi, chỉnh sửa độ khó Elo, đáp án, hoặc thêm/xóa câu hỏi tùy chỉnh. Mọi thay đổi sẽ đồng bộ ngay lập tức cho học viên làm bài trên Mobile.
              </p>
            </div>
          </div>
        )}

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
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="test-grid">
              {tests.length === 0 ? (
                <div style={{ padding: '24px', color: '#64748b' }}>Không tìm thấy bài thi nào phù hợp.</div>
              ) : (
                tests.map(test => (
                  <div className="test-card" key={test.id}>
                    <div className="test-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`test-level-badge ${getLevelBadgeClass(test.ceftLevel)}`}>
                          {test.ceftLevel || 'N/A'}
                        </span>
                        {test.lessonId === null || (test.title && test.title.toLowerCase().includes('đầu vào')) ? (
                          <span className="test-badge-type placement" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} />Test đầu vào</span>
                        ) : (
                          <span className="test-badge-type lesson">Bài học #{test.lessonId}</span>
                        )}
                      </div>
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

                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button 
                        className="test-manage-questions-btn"
                        style={{ flex: 1, margin: 0 }}
                        onClick={() => navigate(`/admin/tests/${test.id}`)}
                        title="Xem chi tiết & Quản lý câu hỏi"
                      >
                        <Eye size={15} /> Xem chi tiết
                      </button>
                      <button 
                        className="test-manage-questions-btn"
                        style={{
                          flex: 1,
                          margin: 0,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}
                        onClick={() => navigate(`/admin/tests/${test.id}/results`)}
                        title="Xem kết quả thi của học viên"
                      >
                        <BarChart2 size={15} /> Kết quả thi
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BẢNG ĐIỀU HƯỚNG PHÂN TRANG SERVER-SIDE */}
            {pagination.totalPages > 1 && (
              <div className="pagination-bar">
                <span className="pagination-info">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trên tổng số {pagination.total} bài thi
                </span>
                <div className="pagination-controls">
                  <button 
                    disabled={pagination.page <= 1} 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="page-nav-btn"
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                    if (
                      pageNum === 1 || 
                      pageNum === pagination.totalPages || 
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          className={`page-num-btn ${pageNum === pagination.page ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                      return <span key={pageNum} className="page-ellipsis">...</span>;
                    }
                    return null;
                  })}

                  <button 
                    disabled={pagination.page >= pagination.totalPages} 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="page-nav-btn"
                    title="Trang tiếp"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
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
