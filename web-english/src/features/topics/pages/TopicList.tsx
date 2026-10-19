import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, BookOpen, ArrowUp, ArrowDown, Upload, Image as ImageIcon, X, Eye } from 'lucide-react';
import { fetchTopics, createTopic, updateTopic, deleteTopic } from '../api/topic.api';
import { uploadMedia } from '../../tests/api/test.api';
import { useToast } from '../../../context/ToastContext';
import '../../courses/pages/CourseList.css';

const TopicList: React.FC = () => {
  const navigate = useNavigate();
  const { toast, confirmModal } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCefr, setFilterCefr] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cefrLevel: '',
    imageUrl: ''
  });

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await fetchTopics(filterCefr);
      if (res.data) setTopics(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải danh sách chủ đề');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [filterCefr]);

  const handleOpenModal = (topic?: any) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        title: topic.title || '',
        description: topic.description || '',
        cefrLevel: topic.cefrLevel || '',
        imageUrl: topic.imageUrl || ''
      });
    } else {
      setEditingTopic(null);
      setFormData({
        title: '',
        description: '',
        cefrLevel: '',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTopic(null);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadMedia(file);
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Tải ảnh chủ đề thành công!');
      }
    } catch (err) {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, formData);
        toast.success('Cập nhật chủ đề thành công!');
      } else {
        await createTopic(formData);
        toast.success('Tạo chủ đề thành công!');
      }
      handleCloseModal();
      loadTopics();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu chủ đề');
    }
  };

  const handleDelete = (id: number) => {
    confirmModal({
      title: 'Xóa chủ đề',
      message: 'Bạn có chắc chắn muốn xóa chủ đề này? Các bài học thuộc chủ đề sẽ chuyển thành chưa phân loại.',
      confirmText: 'Xóa chủ đề',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTopic(id);
          toast.success('Đã xóa chủ đề thành công!');
          loadTopics();
        } catch (error) {
          toast.error('Có lỗi xảy ra khi xóa chủ đề');
        }
      }
    });
  };

  const getSortedTopics = () => {
    const cefrRank: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    return [...topics].sort((a, b) => {
      const rankA = cefrRank[a.cefrLevel] || 99;
      const rankB = cefrRank[b.cefrLevel] || 99;
      return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
    });
  };

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main">
          <div className="course-list-header">
            <h2>Quản lý chủ đề</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="add-course-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Thêm chủ đề
              </button>
            </div>
          </div>

          <div className="course-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select 
                className="filter-select" 
                value={filterCefr} 
                onChange={(e) => setFilterCefr(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Tất cả cấp độ CEFR</option>
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>

            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Hiển thị {topics.length} chủ đề
            </span>
          </div>

          <div className="course-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách chủ đề...</div>
            ) : (
              <table className="course-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên chủ đề</th>
                    <th>Mô tả</th>
                    <th onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ cursor: 'pointer', userSelect: 'none', color: '#2563eb' }} title="Bấm để sắp xếp">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Cấp độ {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    </th>
                    <th>Số bài học</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedTopics().map((topic) => (
                    <tr key={topic.id} style={{ cursor: 'pointer' }} onClick={(e) => { if ((e.target as Element).closest('.action-buttons')) return; navigate('/admin/courses?topicId=' + topic.id); }}>
                      <td>{topic.id}</td>
                      <td>
                        {topic.imageUrl ? (
                          <img 
                            src={topic.imageUrl} 
                            alt={topic.title} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://placehold.co/40x40?text=Topic';
                            }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td><strong>{topic.title}</strong></td>
                      <td style={{ maxWidth: '200px' }}>
                        <div className="description-truncate" title={topic.description || ''}>
                          {topic.description || <span style={{ color: '#94a3b8' }}>Chưa có mô tả</span>}
                        </div>
                      </td>
                      <td>
                        {topic.cefrLevel ? (
                          <span className={`cefr-badge badge-${topic.cefrLevel.toLowerCase()}`}>
                            {topic.cefrLevel}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>
                      <td>{topic.lessons?.length || 0}</td>
                      <td>{new Date(topic.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view-detail"
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/admin/courses?topicId=' + topic.id);
                            }}
                          >
                            <Eye size={15} /> Xem chi tiết
                          </button>
                          <button className="btn-edit" onClick={() => handleOpenModal(topic)}>
                            <Edit size={18} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(topic.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {topics.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center' }}>Chưa có chủ đề nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên chủ đề (*)</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ví dụ: Chào hỏi, Cuộc sống..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Nhập mô tả cho chủ đề..."
                />
              </div>
              <div className="form-group">
                <label>Cấp độ (CEFR)</label>
                <select 
                  value={formData.cefrLevel} 
                  onChange={(e) => setFormData({...formData, cefrLevel: e.target.value})}
                >
                  <option value="">Không có cấp độ</option>
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Proficient</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hình ảnh chủ đề</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                    placeholder="URL hình ảnh hoặc bấm Tải ảnh lên..."
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleUploadImage}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 14px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Upload size={14} /> {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
                  </button>
                </div>
                {formData.imageUrl && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/56x56?text=Invalid';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Xem trước ảnh chủ đề</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>{formData.imageUrl}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                      title="Xóa ảnh"
                    >
                      <X size={14} /> Xóa ảnh
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="submit-btn">{editingTopic ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TopicList;
