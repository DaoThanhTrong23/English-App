import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, FileUp, Save, UploadCloud, Type, Image as ImageIcon, Volume2, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout';
import './AddWord.css';

const AddWord: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'file'>('manual');

  const [searchEn, setSearchEn] = useState('');
  const [searchVi, setSearchVi] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [wordData, setWordData] = useState({
    headword: '',
    partOfSpeech: '',
    cefrLevel: 'A1',
    phonetic: '',
    meaning: '',
    exampleSentence: '',
    audioUrl: '',
    imageUrl: ''
  });

  const guessCefrLevel = (word: string) => {
    const len = word.length;
    if (len <= 4) return 'A1';
    if (len <= 6) return 'A2';
    if (len <= 8) return 'B1';
    if (len <= 10) return 'B2';
    return 'C1';
  };

  const handleSearch = async () => {
    if (!searchEn.trim() && !searchVi.trim()) {
      alert("Vui lòng nhập từ khóa để tra cứu.");
      return;
    }

    setIsSearching(true);
    setPreviewImages([]);
    setSelectedImageIndex(null);

    try {
      let engWord = searchEn.trim();
      let vieWord = searchVi.trim();

      // Google Translate
      if (engWord && !vieWord) {
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(engWord)}`);
        vieWord = res.data[0][0][0];
        setSearchVi(vieWord);
      } else if (vieWord && !engWord) {
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(vieWord)}`);
        engWord = res.data[0][0][0].toLowerCase();
        setSearchEn(engWord);
      }

      let newData = {
        ...wordData,
        headword: engWord,
        meaning: vieWord,
        cefrLevel: guessCefrLevel(engWord),
        partOfSpeech: '',
        phonetic: '',
        exampleSentence: '',
        audioUrl: '',
        imageUrl: ''
      };

      try {
        const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(engWord)}`);
        if (dictRes.data && dictRes.data.length > 0) {
          const entry = dictRes.data[0];

          const pos = entry.meanings?.[0]?.partOfSpeech || '';
          if (pos) newData.partOfSpeech = pos;

          const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
          if (phonetic) newData.phonetic = phonetic;

          const audio = entry.phonetics?.find((p: any) => p.audio && p.audio.length > 0)?.audio || '';
          if (audio) newData.audioUrl = audio;

          let example = '';
          entry.meanings?.forEach((m: any) => {
            if (!example) {
              const defWithEx = m.definitions?.find((d: any) => d.example);
              if (defWithEx) example = defWithEx.example;
            }
          });
          if (example) newData.exampleSentence = example;
        }
      } catch (e) {
        // Silent fallback
      }

      // Datamuse API
      if (!newData.phonetic || !newData.partOfSpeech) {
        try {
          const dmRes = await axios.get(`https://api.datamuse.com/words?sp=${encodeURIComponent(engWord)}&md=pr&ipa=1&max=1`);
          if (dmRes.data && dmRes.data.length > 0) {
            const tags = dmRes.data[0].tags || [];
            if (!newData.phonetic) {
              const ipaTag = tags.find((t: string) => t.startsWith('ipa_pron:'));
              if (ipaTag) newData.phonetic = '/' + ipaTag.replace('ipa_pron:', '') + '/';
            }
            if (!newData.partOfSpeech) {
              if (tags.includes('n')) newData.partOfSpeech = 'noun';
              else if (tags.includes('v')) newData.partOfSpeech = 'verb';
              else if (tags.includes('adj')) newData.partOfSpeech = 'adjective';
              else if (tags.includes('adv')) newData.partOfSpeech = 'adverb';
            }
          }
        } catch (e) { }
      }

      // Youdao TTS API
      if (!newData.audioUrl) {
        newData.audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(engWord)}&type=1`;
      }

      // Wikimedia Commons API
      let fetchedImages: string[] = [];
      try {
        const commonsRes = await axios.get(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(engWord)}%20filetype:bitmap&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
        const imgPages = commonsRes.data.query?.pages;
        if (imgPages) {
          Object.values(imgPages).forEach((p: any) => {
            const url = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
            if (url && fetchedImages.length < 5) {
              fetchedImages.push(url);
            }
          });
        }
      } catch (e) { }

      // Wikipedia API Extract
      try {
        const wikiRes = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(engWord)}&prop=extracts&format=json&exsentences=1&exlimit=1&explaintext=1&origin=*`);
        const pages = wikiRes.data.query?.pages;
        if (pages) {
          const firstPageId = Object.keys(pages)[0];
          if (firstPageId !== "-1") {
            const pageData = pages[firstPageId];
            if (!newData.exampleSentence && pageData.extract) {
              newData.exampleSentence = pageData.extract;
            }
          }
        }
      } catch (e) { }

      // LoremFlickr Fallback
      let flickrIndex = 1;
      while (fetchedImages.length < 5) {
        fetchedImages.push(`https://loremflickr.com/400/400/${encodeURIComponent(engWord)}?lock=${flickrIndex}`);
        flickrIndex++;
      }

      setPreviewImages(fetchedImages);
      setWordData(newData);
    } catch (error) {
      alert("Tra cứu thất bại. Vui lòng kiểm tra lại kết nối hoặc từ vựng.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (index: number, url: string) => {
    setSelectedImageIndex(index);
    setWordData(prev => ({ ...prev, imageUrl: url }));
  };

  const handleSaveWord = async () => {
    if (previewImages.length > 0 && selectedImageIndex === null) {
      alert("Vui lòng chọn hình ảnh minh họa trước khi lưu.");
      return;
    }
    try {
      const { createWord } = await import('../api/words.api');
      await createWord(wordData);
      alert(`Đã lưu từ vựng: "${wordData.headword}" thành công!`);
      // Optional: Navigate to word list or clear form
      setWordData({
        headword: '', partOfSpeech: '', cefrLevel: 'A1', phonetic: '',
        meaning: '', exampleSentence: '', audioUrl: '', imageUrl: ''
      });
      setPreviewImages([]);
      setSelectedImageIndex(null);
      setSearchEn('');
      setSearchVi('');
    } catch (error: any) {
      alert("Lỗi khi lưu từ vựng: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <AdminLayout>
      <div className="add-word-main glass-panel">
        <div className="add-word-header">
          <div className="add-word-header-flex">
            <button className="back-btn" onClick={() => navigate('/admin/words')}>
              <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Quay lại
            </button>
          </div>
          <div className='title-add-word'>
            <h2 style={{ color: 'black', fontSize: 40, fontWeight: 800 }}>Thêm từ vựng mới</h2>
            <p >Tra cứu tự động và bổ sung dữ liệu vào hệ thống</p>
          </div>
        </div>

        <div className="add-word-tabs">
          <button
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <Type size={16} /> Nhập thủ công
          </button>
          <button
            className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <FileUp size={16} /> Nhập từ file
          </button>
        </div>

        <div className="add-word-content">
          {activeTab === 'manual' && (
            <div className="manual-tab">

              <div className="search-section">
                <div className="search-inputs">
                  <div className="search-input-group">
                    <label>Tiếng Anh</label>
                    <input
                      type="text"
                      value={searchEn}
                      onChange={(e) => {
                        setSearchEn(e.target.value);
                        if (e.target.value) setSearchVi('');
                      }}
                      placeholder="Nhập từ khóa tiếng Anh"
                      className="search-input"
                    />
                  </div>
                  <div className="search-input-group">
                    <label>Tiếng Việt</label>
                    <input
                      type="text"
                      value={searchVi}
                      onChange={(e) => {
                        setSearchVi(e.target.value);
                        if (e.target.value) setSearchEn('');
                      }}
                      placeholder="Hoặc nhập từ khóa tiếng Việt"
                      className="search-input"
                    />
                  </div>
                </div>
                <button
                  className="search-btn"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? 'Đang xử lý...' : <><Search size={16} /> Tra cứu</>}
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Từ vựng (Headword)</label>
                  <input type="text" name="headword" value={wordData.headword} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Loại từ (Part of Speech)</label>
                  <select name="partOfSpeech" value={wordData.partOfSpeech} onChange={handleInputChange}>
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
                  <label>Trình độ (CEFR)</label>
                  <select name="cefrLevel" value={wordData.cefrLevel} onChange={handleInputChange}>
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficient</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phiên âm (Phonetic)</label>
                  <input type="text" name="phonetic" value={wordData.phonetic} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Nghĩa Tiếng Việt (Meaning)</label>
                <textarea name="meaning" rows={2} value={wordData.meaning} onChange={handleInputChange} />
              </div>

              <div className="form-group full-width">
                <label>Câu ví dụ (Example)</label>
                <textarea name="exampleSentence" rows={2} value={wordData.exampleSentence} onChange={handleInputChange} />
              </div>

              {(wordData.audioUrl || previewImages.length > 0) && (
                <div className="preview-container">

                  {wordData.audioUrl && (
                    <div className="preview-section">
                      <h4><Volume2 size={18} /> Phát Âm</h4>
                      <div className="audio-preview">
                        <audio key={wordData.audioUrl} controls src={wordData.audioUrl}></audio>
                      </div>
                    </div>
                  )}

                  {previewImages.length > 0 && (
                    <div className="preview-section image-selection-section">
                      <h4><ImageIcon size={18} /> Chọn hình ảnh minh họa</h4>
                      <p className="image-instruction">Vui lòng chọn một hình ảnh phù hợp nhất với từ vựng</p>
                      <div className="image-options">
                        {previewImages.map((url, idx) => (
                          <div
                            key={idx}
                            className={`image-wrapper ${selectedImageIndex === idx ? 'selected' : ''}`}
                            onClick={() => handleImageSelect(idx, url)}
                          >
                            <img src={url} alt={`Option ${idx + 1}`} className="image-option" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              <div className="form-actions">
                <button
                  className="save-btn"
                  onClick={handleSaveWord}
                  disabled={previewImages.length > 0 && selectedImageIndex === null}
                >
                  <Save size={18} /> Lưu từ vựng
                </button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="file-tab">
              <div className="upload-area">
                <div className="upload-placeholder">
                  <FileUp size={48} className="upload-icon-svg" />
                </div>
                <h3>Kéo thả tập tin vào đây</h3>
                <p>Hỗ trợ định dạng CSV, XLS, XLSX</p>
                <input type="file" className="file-input" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                <button className="browse-btn"><UploadCloud size={16} /> Chọn Tập Tin</button>
              </div>

              <div className="file-requirements">
                <h4>Yêu cầu cấu trúc file</h4>
                <p>Tập tin cần có dòng tiêu đề (Header) với 8 trường dữ liệu sau:</p>
                <code>headword, partOfSpeech, cefrLevel, phonetic, audioUrl, imageUrl, meaning, exampleSentence</code>
                <p className="note">Ghi chú: Trường ID và thời gian sẽ được hệ thống khởi tạo tự động.</p>
              </div>

              <div className="form-actions">
                <button className="save-btn upload-btn"><Save size={18} /> Thêm dữ liệu</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddWord;

