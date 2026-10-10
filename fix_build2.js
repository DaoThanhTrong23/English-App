const fs = require('fs');

let appCode = fs.readFileSync('web-english/src/App.tsx', 'utf8');
appCode = appCode.replace(/import GameStats from '\.\/features\/games\/pages\/GameStats';\n/g, '');
fs.writeFileSync('web-english/src/App.tsx', appCode);

let adminLayoutCode = fs.readFileSync('web-english/src/components/layout/AdminLayout.tsx', 'utf8');
adminLayoutCode = adminLayoutCode.replace(/import \{.*?Search.*?\} from 'lucide-react';/, match => match.replace('Search,', '').replace('Search', ''));
fs.writeFileSync('web-english/src/components/layout/AdminLayout.tsx', adminLayoutCode);

let dashboardCode = fs.readFileSync('web-english/src/features/dashboard/pages/Dashboard.tsx', 'utf8');
dashboardCode = dashboardCode.replace(/import \{.*?LineChart,.*?Line.*?\} from 'recharts';/, match => match.replace('LineChart,', '').replace('Line,', ''));
dashboardCode = dashboardCode.replace(/const entry =/g, '// const entry =');
fs.writeFileSync('web-english/src/features/dashboard/pages/Dashboard.tsx', dashboardCode);

let topicListCode = fs.readFileSync('web-english/src/features/topics/pages/TopicList.tsx', 'utf8');
topicListCode = topicListCode.replace(/e\.target\.closest\('/g, '(e.target as Element).closest(\'');
fs.writeFileSync('web-english/src/features/topics/pages/TopicList.tsx', topicListCode);

let addWordCode = fs.readFileSync('web-english/src/features/words/pages/AddWord.tsx', 'utf8');
addWordCode = addWordCode.replace(/const \{ loading: loadingT, topics, loadTopic \} = useTopics\(\);/g, '// const { loading: loadingT, topics, loadTopic } = useTopics();');
addWordCode = addWordCode.replace(/const res = await createWord\(\{/g, 'await createWord({');
fs.writeFileSync('web-english/src/features/words/pages/AddWord.tsx', addWordCode);
