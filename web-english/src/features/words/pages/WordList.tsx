import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWords, deleteWord, updateWord, restoreWord } from '../api/words.api';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Plus, Edit2, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import './WordList.css';

const WordList: React.FC = () => {
  const navigate = useNavigate();
  const { toast, confirmModal } = useToast();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  // Filters & Sorting
  const [cefrFilter, setCefrFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [hasImageFilter, setHasImageFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [hasAudioFilter, setHasAudioFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'headword' | 'cefrLevel' | 'partOfSpeech' | 'createdAt' | 'id'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Edit Modal State
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const res = await fetchWords({
        page,
        limit,
        search: search.trim() || undefined,
        cefrLevel: cefrFilter !== 'all' ? cefrFilter : undefined,
        partOfSpeech: posFilter !== 'all' ? posFilter : undefined,
        hasImage: hasImageFilter,
        hasAudio: hasAudioFilter,
        sortBy,
        sortOrder
      });
      setWords(res.data);
      setTotal(res.meta.totalItems);
    } catch (error) {
      console.error("Lỗi tải danh sách từ vựng", error);
      toast.error('Lỗi khi tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWords();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, cefrFilter, posFilter, hasImageFilter, hasAudioFilter, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearch('');
    setCefrFilter('all');
    setPosFilter('all');
    setHasImageFilter('all');
    setHasAudioFilter('all');
    setSortBy('id');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || cefrFilter !== 'all' || posFilter !== 'all' || hasImageFilter !== 'all' || hasAudioFilter !== 'all' || sortBy !== 'id' || sortOrder !== 'asc';

  const handleSort = (field: 'headword' | 'cefrLevel' | 'partOfSpeech' | 'createdAt' | 'id') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'headword' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.35 }} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} style={{ color: '#2563eb' }} />
    ) : (
      <ArrowDown size={14} style={{ color: '#2563eb' }} />
    );
  };

  
  const handleRestore = async (id: string, headword: string) => {
    try {
      await restoreWord(id);
      toast.success(`Khôi phục từ vựng "${headword}" thành công`);
      loadWords();
    } catch (error) {
      toast.error('Khôi phục từ vựng thất bại');
    }
  };

  const handleDelete = (id: string, headword: string) => {
    confirmModal({
      title: 'Xóa từ vựng',
      message: `Bạn có chắc chắn muốn xóa từ vựng "${headword}"?`,
      confirmText: 'Xóa từ vựng',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteWord(id);
          toast.success('Xóa từ vựng thành công');
          loadWords();
        } catch (error) {
          toast.error('Xóa từ vựng thất bại');
        }
      }
    });
  };

  const handleEditClick = (word: any) => {
    setEditingWord(word);
    setEditFormData({ ...word });
    setPreviewImages([]);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleAutoFetch = async () => {
    if (!editFormData.headword) return;
    setIsFetching(true);
    try {
      let partOfSpeech = editFormData.partOfSpeech || '';
      let phonetic = editFormData.phonetic || '';
      let exampleSentence = editFormData.exampleSentence || '';
      let meaning = editFormData.meaning || '';
      let audioUrl = editFormData.audioUrl || '';

      if (!meaning) {
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(editFormData.headword)}`);
          const data = await res.json();
          if (data && data[0] && data[0][0]) {
            meaning = data[0][0][0];
          }
        } catch (error) { }
      }

      if (!partOfSpeech || !phonetic || !exampleSentence || !audioUrl) {
        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(editFormData.headword)}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const wordObj = data[0];
            if (!phonetic && wordObj.phonetic) phonetic = wordObj.phonetic;
            if (!audioUrl) {
              const audio = wordObj.phonetics?.find((p: any) => p.audio && p.audio.length > 0)?.audio || '';
              if (audio) audioUrl = audio;
            }
            if (wordObj.meanings && wordObj.meanings.length > 0) {
              if (!partOfSpeech) partOfSpeech = wordObj.meanings[0].partOfSpeech;
              if (!exampleSentence) {
                const def = wordObj.meanings[0].definitions.find((d: any) => d.example);
                if (def) exampleSentence = def.example;
              }
            }
          }
        } catch (error) { }
      }

      if (!partOfSpeech || !phonetic) {
        try {
          const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(editFormData.headword)}&md=pr&ipa=1&max=1`);
          const dmData = await dmRes.json();
          if (Array.isArray(dmData) && dmData.length > 0) {
            const tags = dmData[0].tags || [];
            if (!phonetic) {
              const ipaTag = tags.find((t: string) => t.startsWith('ipa_pron:'));
              if (ipaTag) phonetic = '/' + ipaTag.replace('ipa_pron:', '') + '/';
            }
            if (!partOfSpeech) {
              if (tags.includes('n')) partOfSpeech = 'noun';
              else if (tags.includes('v')) partOfSpeech = 'verb';
              else if (tags.includes('adj')) partOfSpeech = 'adjective';
              else if (tags.includes('adv')) partOfSpeech = 'adverb';
            }
          }
        } catch (e) { }
      }

      if (!exampleSentence) {
        try {
          const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(editFormData.headword)}&prop=extracts&format=json&exsentences=1&exlimit=1&explaintext=1&origin=*`);
          const wikiData = await wikiRes.json();
          const pages = wikiData.query?.pages;
          if (pages) {
            const firstPageId = Object.keys(pages)[0];
            if (firstPageId !== "-1") {
              const pageData = pages[firstPageId];
              if (pageData.extract) {
                exampleSentence = pageData.extract;
              }
            }
          }
        } catch (e) { }
      }

      if (!audioUrl) {
        audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(editFormData.headword)}&type=1`;
      }

      let fetchedImages: string[] = [];
      try {
        const commonsRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(editFormData.headword)}%20filetype:bitmap&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
        const commonsData = await commonsRes.json();
        const imgPages = commonsData.query?.pages;
        if (imgPages) {
          Object.values(imgPages).forEach((p: any) => {
            const url = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
            if (url && fetchedImages.length < 5) {
              fetchedImages.push(url);
            }
          });
        }
      } catch (e) { }

      let flickrIndex = 1;
      while (fetchedImages.length < 5) {
        fetchedImages.push(`https://loremflickr.com/400/400/${encodeURIComponent(editFormData.headword)}?lock=${flickrIndex}`);
        flickrIndex++;
      }
      setPreviewImages(fetchedImages);

      setEditFormData((prev: any) => ({
        ...prev,
        meaning,
        phonetic,
        partOfSpeech,
        exampleSentence,
        audioUrl
      }));
      toast.success('Đã tự động điền các thông tin tìm kiếm được');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tra cứu tự động');
    } finally {
      setIsFetching(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWord(editingWord.id, editFormData);
      toast.success('Cập nhật từ vựng thành công');
      setEditingWord(null);
      loadWords();
    } catch (error) {
      toast.error('Cập nhật từ vựng thất bại');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="word-list-main">
        <div className="word-list-header">
          <h2 className="dashboard-title">Quản lý từ vựng</h2>
          <button className="add-word-btn" onClick={() => navigate('/admin/words/add')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Thêm từ mới
          </button>
        </div>

        <div className="word-filters-container">
          <div className="word-filter-row-top">
            <div className="word-search-wrapper">
              <Search size={18} className="word-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
                className="word-search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search ? (
                <button 
                  className="word-search-clear" 
                  onClick={() => { setSearch(''); setPage(1); }}
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="word-filter-stats">
              Hiển thị <strong>{words.length}</strong> / <strong>{total}</strong> từ vựng
            </div>
          </div>

          <div className="word-filter-row-bottom">
            <div className="filter-group">
              <span className="filter-label">Cấp độ (CEFR):</span>
              <select 
                className="filter-select"
                value={cefrFilter} 
                onChange={(e) => { setCefrFilter(e.target.value); setPage(1); }}
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Loại từ:</span>
              <select 
                className="filter-select"
                value={posFilter} 
                onChange={(e) => { setPosFilter(e.target.value); setPage(1); }}
              >
                <option value="all">Tất cả loại từ</option>
                <option value="noun">Danh từ (Noun)</option>
                <option value="verb">Động từ (Verb)</option>
                <option value="adjective">Tính từ (Adjective)</option>
                <option value="adverb">Trạng từ (Adverb)</option>
                <option value="preposition">Giới từ (Preposition)</option>
                <option value="conjunction">Liên từ (Conjunction)</option>
                <option value="pronoun">Đại từ (Pronoun)</option>
                <option value="determiner">Từ hạn định (Determiner)</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Hình ảnh:</span>
              <select 
                className="filter-select"
                value={hasImageFilter} 
                onChange={(e) => { setHasImageFilter(e.target.value as any); setPage(1); }}
              >
                <option value="all">Tất cả</option>
                <option value="yes">Có hình ảnh</option>
                <option value="no">Chưa có ảnh</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Âm thanh:</span>
              <select 
                className="filter-select"
                value={hasAudioFilter} 
                onChange={(e) => { setHasAudioFilter(e.target.value as any); setPage(1); }}
              >
                <option value="all">Tất cả</option>
                <option value="yes">Có phát âm audio</option>
                <option value="no">Chưa có audio</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Sắp xếp:</span>
              <select 
                className="filter-select"
                value={sortBy} 
                onChange={(e) => { 
                  const val = e.target.value as any;
                  setSortBy(val); 
                  setSortOrder(val === 'headword' ? 'asc' : 'desc');
                  setPage(1); 
                }}
              >
                <option value="id">Theo ID (Mặc định)</option>
                <option value="headword">Từ vựng (A - Z)</option>
                <option value="cefrLevel">Cấp độ CEFR</option>
                <option value="partOfSpeech">Loại từ</option>
                <option value="createdAt">Thời gian tạo</option>
              </select>
            </div>

            <button
              className="filter-select"
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); setPage(1); }}
              title="Đổi chiều sắp xếp"
            >
              {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span>{sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}</span>
            </button>

            {hasActiveFilters && (
              <button 
                className="filter-reset-btn"
                onClick={handleResetFilters}
                title="Xóa tất cả các bộ lọc đang chọn"
              >
                <RotateCcw size={14} /> Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="word-table-container">
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : (
            <table className="word-table">
              <thead>
                <tr>
                  <th className="th-sortable" onClick={() => handleSort('headword')} title="Sắp xếp theo từ vựng">
                    <div className="th-sort-content">
                      <span>Từ vựng</span>
                      {renderSortIcon('headword')}
                    </div>
                  </th>
                  <th className="th-sortable" onClick={() => handleSort('partOfSpeech')} title="Sắp xếp theo loại từ">
                    <div className="th-sort-content">
                      <span>Loại từ</span>
                      {renderSortIcon('partOfSpeech')}
                    </div>
                  </th>
                  <th className="th-sortable" onClick={() => handleSort('cefrLevel')} title="Sắp xếp theo cấp độ CEFR">
                    <div className="th-sort-content">
                      <span>Cấp độ</span>
                      {renderSortIcon('cefrLevel')}
                    </div>
                  </th>
                  <th>Nghĩa</th>
                  <th>Hình ảnh</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {words.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">Không tìm thấy từ vựng nào</td>
                  </tr>
                ) : (
                  words.map((w: any) => (
                    <tr 
                      key={w.id} 
                      style={{ 
                        backgroundColor: w.deletedAt ? '#fef2f2' : undefined 
                      }}
                    >
                      <td className="word-cell" style={{ opacity: w.deletedAt ? 0.45 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong>{w.headword}</strong>
                          {w.deletedAt && (
                            <span style={{ fontSize: '10px', padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 'bold' }}>
                              Đã xóa
                            </span>
                          )}
                        </div>
                        <span className="phonetic">{w.phonetic}</span>
                      </td>
                      <td style={{ opacity: w.deletedAt ? 0.45 : 1 }}>{w.partOfSpeech}</td>
                      <td style={{ opacity: w.deletedAt ? 0.45 : 1 }}><span className={`cefr-badge cefr-${w.cefrLevel?.toLowerCase()}`}>{w.cefrLevel}</span></td>
                      <td style={{ opacity: w.deletedAt ? 0.45 : 1 }}>{w.meaning}</td>
                      <td style={{ opacity: w.deletedAt ? 0.45 : 1 }}>
                        {w.imageUrl ? (
                          <img 
                            src={w.imageUrl} 
                            alt={w.headword} 
                            className="word-thumbnail" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://placehold.co/40x40?text=Word';
                            }}
                          />
                        ) : (
                          <div className="no-image">N/A</div>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {w.deletedAt ? (
                            <button 
                              className="btn-restore" 
                              onClick={() => handleRestore(w.id, w.headword)} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '6px 14px', 
                                background: '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontWeight: 700, 
                                fontSize: '0.85rem',
                                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.4)'
                              }}
                            >
                              <RotateCcw size={14} /> Khôi phục
                            </button>
                          ) : (
                            <>
                              <button className="edit-btn" onClick={() => handleEditClick(w)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Edit2 size={13} /> Sửa
                              </button>
                              <button className="delete-btn" onClick={() => handleDelete(w.id, w.headword)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Trash2 size={13} /> Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Hiển thị:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              <option value={10}>10 từ / trang</option>
              <option value={20}>20 từ / trang</option>
              <option value={50}>50 từ / trang</option>
              <option value={100}>100 từ / trang</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Trang trước
            </button>
            <span>Trang {page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingWord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Sửa từ vựng</h3>
              <button type="button" onClick={handleAutoFetch} disabled={isFetching} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                {isFetching ? 'Đang tra cứu...' : 'Tự động điền dữ liệu thiếu'}
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-grid">
                <div className="form-group">
                  <label>Từ vựng</label>
                  <input type="text" name="headword" value={editFormData.headword || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Cấp độ</label>
                  <select name="cefrLevel" value={editFormData.cefrLevel || ''} onChange={handleEditChange}>
                    <option value="A1">A1</option><option value="A2">A2</option>
                    <option value="B1">B1</option><option value="B2">B2</option>
                    <option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Loại từ</label>
                  <input type="text" name="partOfSpeech" value={editFormData.partOfSpeech || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Phiên âm</label>
                  <input type="text" name="phonetic" value={editFormData.phonetic || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group full-width">
                  <label>Nghĩa tiếng Việt</label>
                  <textarea name="meaning" value={editFormData.meaning || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Câu ví dụ</label>
                  <textarea name="exampleSentence" value={editFormData.exampleSentence || ''} onChange={handleEditChange} />
                </div>
              </div>
              {editFormData.audioUrl && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Phát âm</label>
                  <div style={{ marginTop: '8px' }}>
                    <audio controls src={editFormData.audioUrl} style={{ width: '100%', height: '40px' }}></audio>
                  </div>
                </div>
              )}
              {previewImages.length === 0 && editFormData.imageUrl && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Hình ảnh hiện tại</label>
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={editFormData.imageUrl} 
                      alt="Current" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/80x80?text=Invalid';
                      }}
                    />
                  </div>
                </div>
              )}
              {previewImages.length > 0 && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Chọn hình ảnh mới (Bỏ chọn thì giữ ảnh cũ)</label>
                  <div className="image-options" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {previewImages.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: editFormData.imageUrl === url ? '3px solid #3b82f6' : '2px solid transparent',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          width: '80px', height: '80px',
                          opacity: editFormData.imageUrl === url ? 1 : 0.6
                        }}
                        onClick={() => setEditFormData({ ...editFormData, imageUrl: url })}
                      >
                        <img 
                          src={url} 
                          alt={`Option ${idx + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/80x80?text=Invalid';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditingWord(null)}>Hủy</button>
                <button type="submit" className="save-btn">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default WordList;
