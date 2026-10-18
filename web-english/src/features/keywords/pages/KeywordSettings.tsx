import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit, Trash2, Download, Search, RefreshCw, Hash, Tag, Layers } from 'lucide-react';
import { fetchKeywords, createKeyword, updateKeyword, deleteKeyword, downloadKeywordCsv, type KeywordGroup } from '../api/keyword.api';
import '../../courses/pages/CourseList.css';
import './KeywordSettings.css';

const KeywordSettings: React.FC = () => {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KeywordGroup | null>(null);

  const [formData, setFormData] = useState({
    group: '',
    keywordsText: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchKeywords();
      if (res.data) setGroups(res.data);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Lỗi khi tải danh sách từ khóa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (group?: KeywordGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        group: group.group,
        keywordsText: group.keywords.join(', ')
      });
    } else {
      setEditingGroup(null);
      setFormData({
        group: '',
        keywordsText: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.group.trim()) {
      alert('Vui lòng nhập tên nhóm từ khóa');
      return;
    }

    try {
      const keywords = formData.keywordsText
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      if (editingGroup) {
        await updateKeyword(editingGroup.id, {
          group: formData.group.trim(),
          keywords
        });
        alert('Cập nhật nhóm từ khóa thành công!');
      } else {
        await createKeyword({
          group: formData.group.trim(),
          keywords
        });
        alert('Thêm nhóm từ khóa mới thành công!');
      }
      handleCloseModal();
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    }
  };

  const handleDelete = async (id: string, groupName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm từ khóa "${groupName}" khỏi từ điển đồng nghĩa?`)) {
      try {
        await deleteKeyword(id);
        alert('Đã xóa nhóm từ khóa thành công!');
        loadData();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleDownloadCsv = async () => {
    try {
      await downloadKeywordCsv();
    } catch (e) {
      alert('Không thể tải file CSV');
    }
  };

  // Lọc theo tìm kiếm
  const filteredGroups = groups.filter(item => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    if (item.group.toLowerCase().includes(q)) return true;
    return item.keywords.some(k => k.toLowerCase().includes(q));
  });

  // Thống kê
  const totalKeywords = groups.reduce((acc, g) => acc + g.keywords.length, 0);
  const avgKeywords = groups.length > 0 ? Math.round(totalKeywords / groups.length) : 0;

  // Xem trước các tag trong modal
  const previewKeywords = formData.keywordsText
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  return (
    <AdminLayout>
      <div className="course-list-container">
        <div className="course-list-main">
          {/* Header */}
          <div className="course-list-header">
            <div>
              <h2 style={{ margin: 0 }}>Cài đặt Keyword (Từ điển đồng nghĩa)</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Quản lý các nhóm từ đồng nghĩa trong file <code>synonyms.csv</code> để gợi ý bài học cá nhân hóa cho học viên.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn-download-csv" onClick={handleDownloadCsv} title="Tải file synonyms.csv về máy">
                <Download size={18} /> Xuất file CSV
              </button>
              <button className="add-course-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Thêm nhóm từ khóa
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="keyword-stats-grid">
            <div className="keyword-stat-card">
              <div className="keyword-stat-icon stat-icon-blue">
                <Layers size={24} />
              </div>
              <div className="keyword-stat-info">
                <h4>Nhóm chủ đề</h4>
                <p className="stat-number">{groups.length}</p>
              </div>
            </div>

            <div className="keyword-stat-card">
              <div className="keyword-stat-icon stat-icon-green">
                <Tag size={24} />
              </div>
              <div className="keyword-stat-info">
                <h4>Tổng từ khóa đồng nghĩa</h4>
                <p className="stat-number">{totalKeywords}</p>
              </div>
            </div>

            <div className="keyword-stat-card">
              <div className="keyword-stat-icon stat-icon-purple">
                <Hash size={24} />
              </div>
              <div className="keyword-stat-info">
                <h4>Trung bình / nhóm</h4>
                <p className="stat-number">{avgKeywords}</p>
              </div>
            </div>
          </div>

          {/* Search bar & Refresh */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Tìm nhóm hoặc từ khóa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={loadData}
              title="Tải lại dữ liệu từ server"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                cursor: 'pointer',
                color: '#475569',
                fontSize: '0.875rem'
              }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Làm mới
            </button>
          </div>

          {/* Table */}
          <div className="course-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Đang tải dữ liệu...</div>
            ) : (
              <table className="course-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>STT</th>
                    <th style={{ width: '220px' }}>Nhóm chủ đề</th>
                    <th style={{ width: '120px' }}>Số từ khóa</th>
                    <th>Danh sách từ khóa đồng nghĩa</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((item, idx) => (
                    <tr key={item.id}>
                      <td><strong>#{idx + 1}</strong></td>
                      <td>
                        <span className="group-badge">{item.group}</span>
                      </td>
                      <td>
                        <strong>{item.keywords.length}</strong> từ
                      </td>
                      <td>
                        <div className="keyword-chips-container">
                          {item.keywords.map((kw, kwIdx) => (
                            <span key={kwIdx} className="keyword-chip">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-edit"
                            title="Chỉnh sửa nhóm"
                            onClick={() => handleOpenModal(item)}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="btn-delete"
                            title="Xóa nhóm"
                            onClick={() => handleDelete(item.id, item.group)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGroups.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        {search ? 'Không tìm thấy nhóm từ khóa nào khớp với từ khóa tìm kiếm' : 'Chưa có nhóm từ khóa nào'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh sửa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGroup ? 'Chỉnh sửa nhóm từ khóa' : 'Thêm nhóm từ khóa mới'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                  Tên nhóm chủ đề <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: công nghệ (it), du lịch, ẩm thực..."
                  value={formData.group}
                  onChange={e => setFormData({ ...formData, group: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1'
                  }}
                />
                <div className="form-help-text">
                  Trùng khớp với các sở thích mà học viên lựa chọn lúc Onboarding hoặc trong hồ sơ cá nhân.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                  Danh sách từ khóa đồng nghĩa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="keyword-textarea"
                  rows={5}
                  required
                  placeholder="Nhập các từ khóa phân cách nhau bằng dấu phẩy. Ví dụ: it, lập trình, phần mềm, developer, ai, trí tuệ nhân tạo..."
                  value={formData.keywordsText}
                  onChange={e => setFormData({ ...formData, keywordsText: e.target.value })}
                />
                <div className="form-help-text">
                  Phân cách mỗi từ khóa bằng dấu phẩy (<code>,</code>). Hệ thống sẽ tự động loại bỏ khoảng trắng thừa.
                </div>
              </div>

              {previewKeywords.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Xem trước ({previewKeywords.length} từ khóa):
                  </div>
                  <div className="keyword-chips-container">
                    {previewKeywords.map((kw, i) => (
                      <span key={i} className="keyword-chip" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-submit">
                  {editingGroup ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default KeywordSettings;
