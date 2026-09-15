import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWords, deleteWord, updateWord } from '../api/words.api';
import AdminLayout from '../../../components/layout/AdminLayout';
import './WordList.css';

const WordList: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const res = await fetchWords(page, limit, search);
      setWords(res.data);
      setTotal(res.meta.totalItems);
    } catch (error) {
      console.error("Lỗi tải danh sách từ vựng", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [page, search]);

  const handleDelete = async (id: string, headword: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa từ vựng "${headword}"?`)) {
      try {
        await deleteWord(id);
        alert('Xóa thành công');
        loadWords();
      } catch (error) {
        alert('Xóa thất bại');
      }
    }
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWord(editingWord.id, editFormData);
      alert('Sửa thành công');
      setEditingWord(null);
      loadWords();
    } catch (error) {
      alert('Sửa thất bại');
    }
  };


  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="word-list-main">
        <div className="word-list-header">
          <h2 className="dashboard-title">Quản lý từ vựng</h2>
          <button className="add-word-btn" onClick={() => navigate('/admin/words/add')}>+ Thêm từ mới</button>
        </div>

        <div className="word-list-controls">
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng..."
            className="word-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="word-table-container">
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : (
            <table className="word-table">
              <thead>
                <tr>
                  <th>Từ vựng</th>
                  <th>Loại từ</th>
                  <th>Cấp độ</th>
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
                    <tr key={w.id}>
                      <td className="word-cell">
                        <strong>{w.headword}</strong>
                        <span className="phonetic">{w.phonetic}</span>
                      </td>
                      <td>{w.partOfSpeech}</td>
                      <td><span className={`cefr-badge cefr-${w.cefrLevel?.toLowerCase()}`}>{w.cefrLevel}</span></td>
                      <td>{w.meaning}</td>
                      <td>
                        {w.imageUrl ? (
                          <img src={w.imageUrl} alt={w.headword} className="word-thumbnail" />
                        ) : (
                          <div className="no-image">N/A</div>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEditClick(w)}>Sửa</button>
                          <button className="delete-btn" onClick={() => handleDelete(w.id, w.headword)}>Xóa</button>
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
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Trang trước
          </button>
          <span>Trang {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Trang sau
          </button>
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
                  <select name="partOfSpeech" value={editFormData.partOfSpeech || ''} onChange={handleEditChange}>
                    <option value="">-- Chọn loại từ --</option>
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="verb">Động từ (Verb)</option>
                    <option value="adjective">Tính từ (Adjective)</option>
                    <option value="adverb">Trạng từ (Adverb)</option>
                    <option value="pronoun">Đại từ (Pronoun)</option>
                    <option value="preposition">Giới từ (Preposition)</option>
                    <option value="conjunction">Liên từ (Conjunction)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phiên âm</label>
                  <input type="text" name="phonetic" value={editFormData.phonetic || ''} onChange={handleEditChange} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Nghĩa tiếng Việt</label>
                <input type="text" name="meaning" value={editFormData.meaning || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Câu ví dụ</label>
                <textarea name="exampleSentence" value={editFormData.exampleSentence || ''} onChange={handleEditChange} rows={2} />
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
                    <img src={editFormData.imageUrl} alt="Current" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
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
                        <img src={url} alt={`Option ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
