const fs = require('fs');

let code = fs.readFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', 'utf8');

// Import uploadMedia
if (!code.includes('uploadMedia')) {
  code = code.replace(
    /import \{ fetchCourseById, updateCourse, addWordsToCourse, removeWordFromCourse \} from '\.\.\/api\/course\.api';/,
    "import { fetchCourseById, updateCourse, addWordsToCourse, removeWordFromCourse } from '../api/course.api';\nimport { uploadMedia } from '../../tests/api/test.api';"
  );
}

// Replace the videoUrl input block
if (code.includes('<label>Link Video bài giảng (Youtube URL...)</label>')) {
  const replacement = `<label>Link Audio/Video bài nghe, bài giảng (URL hoặc tải lên)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="https://..." style={{ flex: 1, padding: '8px' }} value={infoForm.videoUrl} onChange={e => setInfoForm({...infoForm, videoUrl: e.target.value})} />
                  <input type="file" id="course-media-upload" style={{ display: 'none' }} accept="audio/*,video/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await uploadMedia(file);
                      if (res?.data?.url) setInfoForm({ ...infoForm, videoUrl: res.data.url });
                    } catch(err) {
                      alert('Lỗi tải file lên');
                    }
                  }} />
                  <button type="button" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => document.getElementById('course-media-upload')?.click()}>Tải file lên</button>
                </div>`;
  
  code = code.replace(
    /<label>Link Video bAi ging \(Youtube URL\.\.\.\)<\/label>\s*<input type="text" placeholder="https:\/\/\.\.\." style=\{\{ width: '100%', padding: '8px' \}\} value=\{infoForm\.videoUrl\} onChange=\{e => setInfoForm\(\{\.\.\.infoForm, videoUrl: e\.target\.value\}\)\} \/>/g,
    replacement
  );
  
  code = code.replace(
    /<label>Link Video bài giảng \(Youtube URL\.\.\.\)<\/label>\s*<input type="text" placeholder="https:\/\/\.\.\." style=\{\{ width: '100%', padding: '8px' \}\} value=\{infoForm\.videoUrl\} onChange=\{e => setInfoForm\(\{\.\.\.infoForm, videoUrl: e\.target\.value\}\)\} \/>/g,
    replacement
  );
}

fs.writeFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', code);
