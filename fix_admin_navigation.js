const fs = require('fs');

let testDetailCode = fs.readFileSync('web-english/src/features/tests/pages/TestDetail.tsx', 'utf8');
testDetailCode = testDetailCode.replace(
  /onClick=\{\(\) => navigate\('\/admin\/tests'\)\}/g,
  "onClick={() => navigate(-1)}"
);
testDetailCode = testDetailCode.replace(
  /Quay l.i danh sA.ch bA.i thi/g,
  "Quay lại"
);
testDetailCode = testDetailCode.replace(
  /Quay lại danh sách bài thi/g,
  "Quay lại"
);
fs.writeFileSync('web-english/src/features/tests/pages/TestDetail.tsx', testDetailCode);

let courseDetailCode = fs.readFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', 'utf8');

// Add useLocation
if (!courseDetailCode.includes('useLocation')) {
  courseDetailCode = courseDetailCode.replace(
    /import \{ useParams, useNavigate \} from 'react-router-dom';/,
    "import { useParams, useNavigate, useLocation } from 'react-router-dom';"
  );
}

// Replace activeTab initialization and add useEffect for hash
if (!courseDetailCode.includes('location.hash')) {
  courseDetailCode = courseDetailCode.replace(
    /const \[activeTab, setActiveTab\] = useState\<'info' \| 'words' \| 'tests'\>\('info'\);/,
    `const location = useLocation();
  const [activeTab, setActiveTab] = useState<'info' | 'words' | 'tests'>(
    (location.hash ? location.hash.replace('#', '') as 'info' | 'words' | 'tests' : 'info')
  );

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);`
  );
  fs.writeFileSync('web-english/src/features/courses/pages/CourseDetail.tsx', courseDetailCode);
}

