import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, FileUp, Save, UploadCloud, Type, Image as ImageIcon, Volume2, ArrowLeft, Download, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../../components/layout/AdminLayout';
import './AddWord.css';
import { fetchTopics, createWord, createBulkWords } from '../api/words.api';

const AddWord: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'file'>('manual');
  
  // States for file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedWords, setParsedWords] = useState<any[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  const [searchEn, setSearchEn] = useState('');
  const [searchVi, setSearchVi] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadingT, setloadingTopic] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);

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


  const loadTopic = async () => {
    setloadingTopic(true);
    try {

      const res = await fetchTopics();
      if (res.data) setTopics(res.data);
    } catch (err) {
      console.error("Lỗi: không thể load danh sách chủ đề", err);
    }
    finally {
      setloadingTopic(false)
    }

  };

  useEffect(() => {


  });

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
    if (!wordData.headword.trim()) {
      alert('Vui lòng nhập từ vựng (Headword)');
      return;
    }

    try {
      await createWord(wordData);
      alert(`Đã thêm từ vựng "${wordData.headword}" thành công!`);
      navigate('/admin/words');
    } catch (error: any) {
      alert("Lỗi khi lưu từ vựng: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        headword: 'apple',
        partOfSpeech: 'noun',
        cefrLevel: 'A1',
        phonetic: '/ˈæp.əl/',
        meaning: 'quả táo',
        exampleSentence: 'I eat an apple every day.',
        audioUrl: '',
        imageUrl: ''
      },
      {
        headword: 'beautiful',
        partOfSpeech: 'adjective',
        cefrLevel: 'A2',
        phonetic: '/ˈbjuː.tɪ.fəl/',
        meaning: 'xinh đẹp, tươi đẹp',
        exampleSentence: 'She has a beautiful voice.',
        audioUrl: '',
        imageUrl: ''
      },
      {
        headword: 'achieve',
        partOfSpeech: 'verb',
        cefrLevel: 'B1',
        phonetic: '/əˈtʃiːv/',
        meaning: 'đạt được, hoàn thành',
        exampleSentence: 'They achieved great success through hard work.',
        audioUrl: '',
        imageUrl: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Words');
    XLSX.writeFile(wb, 'mau_danh_sach_tu_vung.xlsx');
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setUploadSuccess('');
    setParseError('');
    setParsedWords([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (!rawData || rawData.length === 0) {
          setParseError('Tập tin không chứa dòng dữ liệu nào.');
          return;
        }

        const normalized: any[] = [];
        for (const row of rawData) {
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const match = Object.keys(row).find(key => key.trim().toLowerCase() === k.toLowerCase());
              if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
                return String(row[match]).trim();
              }
            }
            return null;
          };

          const headword = getVal(['headword', 'word', 'từ vựng', 'tu vung', 'từ', 'head_word']);
          if (!headword) continue;

          normalized.push({
            headword,
            partOfSpeech: getVal(['partofspeech', 'pos', 'loại từ', 'từ loại', 'tu loai', 'part_of_speech']),
            cefrLevel: getVal(['cefrlevel', 'cefr', 'level', 'cấp độ', 'cap do', 'cefr_level']),
            phonetic: getVal(['phonetic', 'phiên âm', 'phien am', 'ipa']),
            meaning: getVal(['meaning', 'nghĩa', 'nghia', 'dịch nghĩa', 'dich nghia']),
            exampleSentence: getVal(['examplesentence', 'example', 'ví dụ', 'vi du', 'câu ví dụ', 'example_sentence']),
            audioUrl: getVal(['audiourl', 'audio', 'phát âm', 'audio_url']),
            imageUrl: getVal(['imageurl', 'image', 'hình ảnh', 'hinh anh', 'image_url'])
          });
        }

        if (normalized.length === 0) {
          setParseError('Không tìm thấy từ vựng hợp lệ. Vui lòng đảm bảo có cột "headword" hoặc "Từ vựng".');
          return;
        }

        setParsedWords(normalized);
      } catch (err: any) {
        console.error('Lỗi đọc file:', err);
        setParseError('Không thể đọc tập tin: ' + (err.message || 'Định dạng không hỗ trợ'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (parsedWords.length === 0) {
      alert('Vui lòng chọn file chứa từ vựng hợp lệ!');
      return;
    }

    setIsUploading(true);
    setUploadSuccess('');
    setParseError('');

    try {
      await createBulkWords(parsedWords);
      setUploadSuccess(`Đã thêm thành công ${parsedWords.length} từ vựng vào hệ thống!`);
      alert(`Đã thêm thành công ${parsedWords.length} từ vựng vào hệ thống!`);
      setSelectedFile(null);
      setParsedWords([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      navigate('/admin/words');
    } catch (error: any) {
      console.error('Error uploading words:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu từ vựng.';
      setParseError(msg);
      alert('Lỗi: ' + msg);
    } finally {
      setIsUploading(false);
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
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div className="upload-placeholder">
                  <FileUp size={48} className="upload-icon-svg" />
                </div>
                <h3>Kéo thả tập tin vào đây hoặc bấm nút bên dưới</h3>
                <p>Hỗ trợ định dạng Excel (.xlsx, .xls) hoặc CSV</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="file-input" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  onChange={handleFileChange}
                />
                <button 
                  type="button" 
                  className="browse-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={16} /> Chọn Tập Tin
                </button>

                {selectedFile && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
                    <FileSpreadsheet size={18} />
                    <span>Đã chọn: {selectedFile.name} ({parsedWords.length} từ vựng hợp lệ)</span>
                  </div>
                )}
                {parseError && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#ef4444', fontWeight: 600 }}>
                    <AlertTriangle size={16} />
                    <span>{parseError}</span>
                  </div>
                )}
                {uploadSuccess && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#16a34a', fontWeight: 600 }}>
                    <CheckCircle size={16} />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </div>

              <div className="file-requirements">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4>Yêu cầu cấu trúc file</h4>
                    <p style={{ margin: '4px 0', color: '#475569' }}>Tập tin cần có dòng tiêu đề (Header) với các trường dữ liệu sau:</p>
                    <code>headword, partOfSpeech, cefrLevel, phonetic, audioUrl, imageUrl, meaning, exampleSentence</code>
                    <p className="note" style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      (Hệ thống tự động nhận diện cả tên cột tiếng Việt như: <em>Từ vựng, Loại từ, Cấp độ, Phiên âm, Nghĩa, Ví dụ</em>)
                    </p>
                  </div>
                  <button type="button" className="download-template-btn" onClick={handleDownloadTemplate}>
                    <Download size={16} /> Tải file mẫu (.xlsx)
                  </button>
                </div>
              </div>

              {parsedWords.length > 0 && (
                <div className="file-preview-table-container">
                  <div className="file-preview-header">
                    <strong>Xem trước dữ liệu ({parsedWords.length} từ vựng sẵn sàng thêm)</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Hiển thị tối đa 5 từ đầu tiên</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="file-preview-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Từ vựng (Headword)</th>
                          <th>Loại từ</th>
                          <th>Cấp độ</th>
                          <th>Phiên âm</th>
                          <th>Nghĩa tiếng Việt</th>
                          <th>Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedWords.slice(0, 5).map((w, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{w.headword}</strong></td>
                            <td>{w.partOfSpeech || '-'}</td>
                            <td>{w.cefrLevel || '-'}</td>
                            <td>{w.phonetic || '-'}</td>
                            <td>{w.meaning || '-'}</td>
                            <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {w.exampleSentence || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  className="save-btn upload-btn" 
                  onClick={handleFileUpload}
                  disabled={isUploading || parsedWords.length === 0}
                >
                  <Save size={18} /> {isUploading ? 'Đang thêm vào hệ thống...' : `Thêm ${parsedWords.length > 0 ? parsedWords.length : ''} từ vào hệ thống`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddWord;

