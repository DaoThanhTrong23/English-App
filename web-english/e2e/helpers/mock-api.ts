import type { HTTPRequest } from 'puppeteer-core';

export interface RecordedRequest {
  method: string;
  url: string;
  pathname: string;
  searchParams: Record<string, string>;
  body: any;
}

export interface CustomMockRule {
  matcher?: (method: string, pathname: string, url: string) => boolean;
  handler?: (req: RecordedRequest, state: MockState) => { status?: number; body: any; contentType?: string } | Promise<{ status?: number; body: any; contentType?: string }>;
  method?: string;
  pathIncludes?: string;
  status?: number;
  body?: any;
  contentType?: string;
  once?: boolean;
}

export interface MockState {
  currentAdminUser: any;
  currentPermissions: string[];
  notifications: any[];
  dashboardStats: any;
  topics: any[];
  topicSettings: any;
  courses: any[];
  words: any[];
  tests: any[];
  questionsByTest: Record<number, any[]>;
  testResultsByTest: Record<number, any[]>;
  students: any[];
  studentProgress: Record<number, any[]>;
  studentAiChat: Record<number, any[]>;
  keywords: any[];
  aiStats: any;
  aiSessions: any[];
  aiMessagesBySession: Record<number, any[]>;
  games: any[];
  achievements: any[];
  roles: any[];
  permissionsData: any;
  staff: any[];
  candidates: any[];
  activityLogs: any[];
  loginLogs: any[];
  requests: RecordedRequest[];
  customRules: CustomMockRule[];
  artificialDelayMs: number;
}

const ALL_PERMISSION_ITEMS = [
  { id: 1, name: 'READ_DASHBOARD', description: 'Xem thống kê tổng quan', module: 'dashboard' },
  { id: 2, name: 'READ_TOPICS', description: 'Xem danh sách chủ đề', module: 'topics' },
  { id: 3, name: 'CREATE_TOPIC', description: 'Tạo chủ đề mới', module: 'topics' },
  { id: 4, name: 'UPDATE_TOPIC', description: 'Cập nhật chủ đề', module: 'topics' },
  { id: 5, name: 'DELETE_TOPIC', description: 'Xóa chủ đề', module: 'topics' },
  { id: 6, name: 'READ_COURSES', description: 'Xem danh sách khóa học', module: 'courses' },
  { id: 7, name: 'CREATE_COURSE', description: 'Tạo khóa học mới', module: 'courses' },
  { id: 8, name: 'UPDATE_COURSE', description: 'Cập nhật khóa học', module: 'courses' },
  { id: 9, name: 'DELETE_COURSE', description: 'Xóa khóa học', module: 'courses' },
  { id: 10, name: 'READ_WORDS', description: 'Xem ngân hàng từ vựng', module: 'words' },
  { id: 11, name: 'CREATE_WORD', description: 'Thêm từ vựng mới', module: 'words' },
  { id: 12, name: 'UPDATE_WORD', description: 'Cập nhật từ vựng', module: 'words' },
  { id: 13, name: 'DELETE_WORD', description: 'Xóa từ vựng', module: 'words' },
  { id: 14, name: 'READ_TESTS', description: 'Xem danh sách bài kiểm tra', module: 'tests' },
  { id: 15, name: 'CREATE_TEST', description: 'Tạo bài kiểm tra', module: 'tests' },
  { id: 16, name: 'UPDATE_TEST', description: 'Cập nhật bài kiểm tra', module: 'tests' },
  { id: 17, name: 'DELETE_TEST', description: 'Xóa bài kiểm tra', module: 'tests' },
  { id: 18, name: 'READ_USERS', description: 'Xem danh sách học viên', module: 'users' },
  { id: 19, name: 'UPDATE_USER', description: 'Khóa/Mở khóa học viên', module: 'users' },
  { id: 20, name: 'READ_AI_CHAT', description: 'Xem lịch sử AI Chat', module: 'ai_chat' },
  { id: 21, name: 'DELETE_AI_CHAT', description: 'Xóa phiên AI Chat', module: 'ai_chat' },
  { id: 22, name: 'READ_GAMES', description: 'Xem cấu hình Mini-Games', module: 'games' },
  { id: 23, name: 'UPDATE_GAME', description: 'Cập nhật Mini-Games', module: 'games' },
  { id: 24, name: 'READ_ACHIEVEMENTS', description: 'Xem danh sách thành tựu', module: 'achievements' },
  { id: 25, name: 'CREATE_ACHIEVEMENT', description: 'Tạo thành tựu', module: 'achievements' },
  { id: 26, name: 'UPDATE_ACHIEVEMENT', description: 'Cập nhật thành tựu', module: 'achievements' },
  { id: 27, name: 'DELETE_ACHIEVEMENT', description: 'Xóa thành tựu', module: 'achievements' },
  { id: 28, name: 'READ_ROLES', description: 'Xem danh sách vai trò', module: 'roles' },
  { id: 29, name: 'CREATE_ROLE', description: 'Tạo vai trò mới', module: 'roles' },
  { id: 30, name: 'UPDATE_ROLE', description: 'Cập nhật vai trò', module: 'roles' },
  { id: 31, name: 'DELETE_ROLE', description: 'Xóa vai trò', module: 'roles' },
  { id: 32, name: 'READ_STAFF', description: 'Xem danh sách nhân sự', module: 'staff' },
  { id: 33, name: 'CREATE_STAFF', description: 'Thêm nhân sự mới', module: 'staff' },
  { id: 34, name: 'UPDATE_STAFF', description: 'Cập nhật nhân sự', module: 'staff' },
  { id: 35, name: 'DELETE_STAFF', description: 'Xóa nhân sự', module: 'staff' },
  { id: 36, name: 'READ_LOGS', description: 'Xem nhật ký hệ thống', module: 'logs' },
];

function groupPermissions(list: typeof ALL_PERMISSION_ITEMS) {
  const grouped: Record<string, typeof ALL_PERMISSION_ITEMS> = {};
  for (const p of list) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }
  return grouped;
}

export function createDefaultMockState(): MockState {
  const allPermNames = ALL_PERMISSION_ITEMS.map((p) => p.name);
  return {
    currentAdminUser: {
      id: 1,
      username: 'SuperAdmin',
      email: 'admin@english.com',
      role: 'admin',
      roleId: 1,
      isAdmin: true,
      job: 'System Administrator',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    currentPermissions: allPermNames,
    notifications: [
      {
        id: 101,
        userId: 1,
        title: 'Học viên mới đăng ký',
        body: 'Học viên nguyenvana vừa hoàn thành bài thi xếp lớp.',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 102,
        userId: 1,
        title: 'Cập nhật bài học thành công',
        body: 'Bài học Greetings đã được cập nhật nội dung mới.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 103,
        userId: 1,
        title: 'Báo cáo từ vựng hàng tuần',
        body: 'Đã bổ sung 50 từ vựng mới vào kho dữ liệu.',
        isRead: true,
        createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      },
    ],
    dashboardStats: {
      totalStudents: 1250,
      totalCourses: 45,
      totalWords: 3200,
      totalTests: 28,
      trafficData: [
        { name: 'T2', visits: 120, completions: 35 },
        { name: 'T3', visits: 145, completions: 42 },
        { name: 'T4', visits: 132, completions: 38 },
        { name: 'T5', visits: 190, completions: 55 },
        { name: 'T6', visits: 210, completions: 64 },
        { name: 'T7', visits: 165, completions: 49 },
        { name: 'CN', visits: 185, completions: 60 },
      ],
      levelData: [
        { name: 'Cơ bản (A1-A2)', value: 750, color: '#3b82f6' },
        { name: 'Trung cấp (B1-B2)', value: 430, color: '#10b981' },
        { name: 'Cao cấp (C1-C2)', value: 70, color: '#8b5cf6' },
      ],
      summary: {
        totalUsers: 1250,
        newUsersToday: 18,
        totalTopics: 12,
        totalCourses: 45,
        totalWords: 3200,
        totalTests: 28,
        totalTestAttempts: 840,
      },
      charts: {
        usersByLevel: [
          { name: 'A1', value: 400 },
          { name: 'A2', value: 350 },
          { name: 'B1', value: 280 },
          { name: 'B2', value: 150 },
          { name: 'C1', value: 50 },
          { name: 'C2', value: 20 },
        ],
        activity7Days: [
          { date: '18/02', newUsers: 10, testAttempts: 35 },
          { date: '19/02', newUsers: 14, testAttempts: 42 },
          { date: '20/02', newUsers: 12, testAttempts: 38 },
          { date: '21/02', newUsers: 19, testAttempts: 55 },
          { date: '22/02', newUsers: 22, testAttempts: 64 },
          { date: '23/02', newUsers: 16, testAttempts: 49 },
          { date: '24/02', newUsers: 18, testAttempts: 60 },
        ],
      },
      topStudents: [
        { id: 1, username: 'MinhAnh99', email: 'minhanh@gmail.com', xpPoints: 15400, currentStreak: 45, cefrLevel: 'C1', avatarUrl: null },
        { id: 2, username: 'HoangNam', email: 'hoangnam@gmail.com', xpPoints: 12800, currentStreak: 30, cefrLevel: 'B2', avatarUrl: null },
        { id: 3, username: 'ThaoVy', email: 'thaovy@gmail.com', xpPoints: 11200, currentStreak: 25, cefrLevel: 'B2', avatarUrl: null },
        { id: 4, username: 'DucHuy', email: 'duchuy@gmail.com', xpPoints: 9500, currentStreak: 18, cefrLevel: 'B1', avatarUrl: null },
        { id: 5, username: 'LanHuong', email: 'lanhuong@gmail.com', xpPoints: 8900, currentStreak: 14, cefrLevel: 'B1', avatarUrl: null },
      ],
    },
    topics: [
      {
        id: 1,
        title: 'Daily Conversations',
        cefrLevel: 'A1',
        description: 'Giao tiếp hàng ngày cơ bản',
        imageUrl: 'https://dummyimage.com/100x100/2563eb/ffffff.png&text=Daily',
        coverImageUrl: 'https://dummyimage.com/100x100/2563eb/ffffff.png&text=Daily',
        lessons: [{ id: 10 }, { id: 11 }],
        totalLessons: 2,
        createdAt: '2026-01-10T08:00:00.000Z',
        deletedAt: null,
        isDeleted: false,
      },
      {
        id: 2,
        title: 'Business English',
        cefrLevel: 'B2',
        description: 'Tiếng Anh thương mại công sở',
        imageUrl: 'https://dummyimage.com/100x100/10b981/ffffff.png&text=Biz',
        coverImageUrl: 'https://dummyimage.com/100x100/10b981/ffffff.png&text=Biz',
        lessons: [{ id: 12 }],
        totalLessons: 1,
        createdAt: '2026-01-15T08:00:00.000Z',
        deletedAt: null,
        isDeleted: false,
      },
      {
        id: 3,
        title: 'Academic Research',
        cefrLevel: 'C1',
        description: 'Tiếng Anh học thuật chuyên sâu',
        imageUrl: null,
        coverImageUrl: null,
        lessons: [],
        totalLessons: 0,
        createdAt: '2026-01-20T08:00:00.000Z',
        deletedAt: '2026-02-01T00:00:00.000Z',
        isDeleted: true,
      },
    ],
    topicSettings: {
      defaultLimit: 4,
      groups: {
        'A1-A2': 5,
        'B1-B2': 4,
        'C1-C2': 3,
      },
      levels: {
        A1: 5,
        A2: 5,
        B1: 4,
        B2: 4,
        C1: 3,
        C2: 3,
      },
    },
    courses: [
      {
        id: 10,
        title: 'Greetings and Introductions',
        cefrLevel: 'A1',
        topicId: 1,
        topic: { id: 1, title: 'Daily Conversations', isDeleted: false },
        description: 'Bài học chào hỏi và giới thiệu bản thân',
        thumbnailUrl: 'https://dummyimage.com/200x120/2563eb/ffffff.png&text=Course10',
        imageUrl: 'https://dummyimage.com/200x120/2563eb/ffffff.png&text=Course10',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        content: 'Chào mừng bạn đến với bài học Greetings.',
        createdAt: '2026-01-12T08:00:00.000Z',
        deletedAt: null,
        isDeleted: false,
        isTopicDeleted: false,
        words: [
          {
            wordId: 1001,
            word: {
              id: 1001,
              headword: 'hello',
              partOfSpeech: 'noun',
              cefrLevel: 'A1',
              meaning: 'xin chào',
              meaningVi: 'xin chào',
              phonetic: '/həˈləʊ/',
            },
          },
          {
            wordId: 1002,
            word: {
              id: 1002,
              headword: 'negotiate',
              partOfSpeech: 'verb',
              cefrLevel: 'B2',
              meaning: 'đàm phán, thương lượng',
              meaningVi: 'đàm phán, thương lượng',
              phonetic: '/nəˈɡəʊ.ʃi.eɪt/',
            },
          },
        ],
      },
      {
        id: 11,
        title: 'Office Meetings & Negotiations',
        cefrLevel: 'B2',
        topicId: 2,
        topic: { id: 2, title: 'Business English', isDeleted: false },
        description: 'Kỹ năng họp và đàm phán trong doanh nghiệp',
        thumbnailUrl: null,
        imageUrl: null,
        videoUrl: '',
        content: 'Nội dung lý thuyết đàm phán thương mại.',
        createdAt: '2026-01-16T08:00:00.000Z',
        deletedAt: null,
        isDeleted: false,
        isTopicDeleted: false,
        words: [],
      },
      {
        id: 12,
        title: 'Archived Grammar Lesson',
        cefrLevel: 'A2',
        topicId: 1,
        topic: { id: 1, title: 'Daily Conversations', isDeleted: false },
        description: 'Bài học đã tạm ẩn để bảo trì',
        thumbnailUrl: null,
        imageUrl: null,
        videoUrl: '',
        content: '',
        createdAt: '2026-01-18T08:00:00.000Z',
        deletedAt: '2026-02-05T00:00:00.000Z',
        isDeleted: true,
        isTopicDeleted: false,
        words: [],
      },
    ],
    words: [
      {
        id: 1001,
        headword: 'hello',
        phonetic: '/həˈləʊ/',
        partOfSpeech: 'noun',
        cefrLevel: 'A1',
        meaning: 'xin chào',
        meaningVi: 'xin chào',
        exampleSentence: 'Hello, how are you today?',
        exampleEn: 'Hello, how are you today?',
        exampleVi: 'Xin chào, hôm nay bạn thế nào?',
        imageUrl: 'https://dummyimage.com/80x80/3b82f6/ffffff.png&text=hello',
        audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3',
        listeningCode: 'HELLO01',
        deletedAt: null,
        isDeleted: false,
      },
      {
        id: 1002,
        headword: 'negotiate',
        phonetic: '/nəˈɡəʊ.ʃi.eɪt/',
        partOfSpeech: 'verb',
        cefrLevel: 'B2',
        meaning: 'đàm phán, thương lượng',
        meaningVi: 'đàm phán, thương lượng',
        exampleSentence: 'We need to negotiate a better contract.',
        exampleEn: 'We need to negotiate a better contract.',
        exampleVi: 'Chúng ta cần đàm phán một hợp đồng tốt hơn.',
        imageUrl: null,
        audioUrl: null,
        listeningCode: 'NEGO02',
        deletedAt: null,
        isDeleted: false,
      },
      {
        id: 1003,
        headword: 'sustainable',
        phonetic: '/səˈsteɪ.nə.bəl/',
        partOfSpeech: 'adjective',
        cefrLevel: 'C1',
        meaning: 'bền vững',
        meaningVi: 'bền vững',
        exampleSentence: 'Sustainable development is crucial.',
        exampleEn: 'Sustainable development is crucial.',
        exampleVi: 'Phát triển bền vững là rất quan trọng.',
        imageUrl: 'https://dummyimage.com/80x80/10b981/ffffff.png&text=sust',
        audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/sustainable-us.mp3',
        listeningCode: 'SUST03',
        deletedAt: null,
        isDeleted: false,
      },
      {
        id: 1004,
        headword: 'obsolete',
        phonetic: '/ˌɒb.səˈliːt/',
        partOfSpeech: 'adjective',
        cefrLevel: 'C2',
        meaning: 'lỗi thời',
        meaningVi: 'lỗi thời',
        exampleSentence: 'This machine is obsolete.',
        exampleEn: 'This machine is obsolete.',
        exampleVi: 'Cỗ máy này đã lỗi thời.',
        imageUrl: null,
        audioUrl: null,
        listeningCode: 'OBSO04',
        deletedAt: '2026-02-01T00:00:00.000Z',
        isDeleted: true,
      },
    ],
    tests: [
      {
        id: 201,
        title: 'Placement Test Toàn Diện 2026',
        description: 'Bài thi đánh giá năng lực đầu vào toàn diện',
        ceftLevel: 'ALL',
        lessonId: null,
        durationInMinutes: 30,
        passingScore: 50,
        totalQuestions: 20,
        createdAt: '2026-01-05T08:00:00.000Z',
        _count: { questions: 2 },
      },
      {
        id: 202,
        title: 'Midterm Assessment A1-A2',
        description: 'Đề kiểm tra định kỳ cấp độ A1-A2',
        ceftLevel: 'A1-A2',
        lessonId: null,
        durationInMinutes: 20,
        passingScore: 70,
        totalQuestions: 15,
        createdAt: '2026-01-10T08:00:00.000Z',
        _count: { questions: 0 },
      },
      {
        id: 203,
        title: 'Luyện Nghe: Greetings and Introductions',
        description: 'Bài luyện tập gắn kèm bài học số 10',
        ceftLevel: 'A1',
        lessonId: 10,
        durationInMinutes: 15,
        passingScore: 60,
        totalQuestions: 10,
        createdAt: '2026-01-12T08:00:00.000Z',
        _count: { questions: 1 },
      },
    ],
    questionsByTest: {
      201: [
        {
          id: 501,
          testId: 201,
          skillCategory: 'Reading',
          skill: 'reading',
          questionType: 'multiple_choice',
          quesionText: 'What is the synonym of "happy"?',
          questionText: 'What is the synonym of "happy"?',
          points: 10,
          difficultyElo: 1200,
          topic: 'Feelings',
          audioUrl: '',
          mediaUrl: null,
          imageUrl: '',
          explanation: 'Joyful means feeling great pleasure and happiness.',
          answers: [
            { id: 1, answerText: 'Joyful', isCorrect: true },
            { id: 2, answerText: 'Angry', isCorrect: false },
            { id: 3, answerText: 'Tired', isCorrect: false },
            { id: 4, answerText: 'Hungry', isCorrect: false },
          ],
        },
        {
          id: 502,
          testId: 201,
          skillCategory: 'Listening',
          skill: 'listening',
          questionType: 'fill_in_blank',
          quesionText: 'Listen and fill in the missing word: Good ____!',
          questionText: 'Listen and fill in the missing word: Good ____!',
          points: 15,
          difficultyElo: 1150,
          topic: 'Greetings',
          audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/morning-us.mp3',
          mediaUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/morning-us.mp3',
          imageUrl: 'https://dummyimage.com/120x80/2563eb/ffffff.png&text=Morning',
          explanation: 'The speaker says Good morning.',
          answers: [
            { id: 5, answerText: 'morning', isCorrect: true },
          ],
        },
      ],
      202: [],
      203: [],
    },
    testResultsByTest: {
      201: [
        {
          id: 901,
          score: 85,
          totalScore: 85,
          correctCount: 17,
          totalQuestions: 20,
          takenAt: '2026-02-20T09:30:00.000Z',
          completedAt: '2026-02-20T09:30:00.000Z',
          user: { id: 1, username: 'MinhAnh99', email: 'minhanh@gmail.com', avatarUrl: null },
          test: { title: 'Placement Test Toàn Diện 2026', passingScore: 50 },
        },
        {
          id: 902,
          score: 40,
          totalScore: 40,
          correctCount: 8,
          totalQuestions: 20,
          takenAt: '2026-02-21T14:15:00.000Z',
          completedAt: '2026-02-21T14:15:00.000Z',
          user: { id: 2, username: 'HoangNam', email: 'hoangnam@gmail.com', avatarUrl: null },
          test: { title: 'Placement Test Toàn Diện 2026', passingScore: 50 },
        },
      ],
      202: [],
    },
    students: [
      {
        id: 1,
        username: 'MinhAnh99',
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@gmail.com',
        avatarUrl: null,
        cefrLevel: 'C1',
        xpPoints: 15400,
        currentStreak: 45,
        isLocked: false,
        createdAt: '2026-02-20T08:00:00.000Z',
        joinedAt: '2026-02-20T08:00:00.000Z',
        lastLoginDate: '2026-02-24T10:00:00.000Z',
        lastActiveAt: '2026-02-24T10:30:00.000Z',
        lastestActivity: 'Hoàn thành bài thi Placement Test',
        grammarElo: 1520,
        vocabElo: 1560,
        readingElo: 1620,
        listeningElo: 1580,
        speakingElo: 1490,
        writingElo: 1510,
        preferredTopics: '1,2',
        progress: {
          totalWordsTracked: 620,
          masteredWords: 480,
          learningWords: 140,
          completedTestCount: 12,
          achivievementsCount: 2,
        },
      },
      {
        id: 2,
        username: 'HoangNam',
        fullName: 'Trần Hoàng Nam',
        email: 'hoangnam@gmail.com',
        avatarUrl: null,
        cefrLevel: 'B2',
        xpPoints: 12800,
        currentStreak: 30,
        isLocked: false,
        createdAt: '2026-01-15T08:00:00.000Z',
        joinedAt: '2026-01-15T08:00:00.000Z',
        lastLoginDate: '2026-02-23T10:00:00.000Z',
        lastActiveAt: '2026-02-23T11:00:00.000Z',
        lastestActivity: 'Học từ vựng Business English',
        grammarElo: 1400,
        vocabElo: 1420,
        readingElo: 1450,
        listeningElo: 1380,
        speakingElo: 1350,
        writingElo: 1390,
        preferredTopics: '2',
        progress: {
          totalWordsTracked: 410,
          masteredWords: 300,
          learningWords: 110,
          completedTestCount: 8,
          achivievementsCount: 1,
        },
      },
      {
        id: 3,
        username: 'LockedUser01',
        fullName: 'Lê Văn Khóa',
        email: 'locked01@gmail.com',
        avatarUrl: null,
        cefrLevel: 'A1',
        xpPoints: 200,
        currentStreak: 0,
        isLocked: true,
        createdAt: '2026-02-01T08:00:00.000Z',
        joinedAt: '2026-02-01T08:00:00.000Z',
        lastLoginDate: '2026-02-02T10:00:00.000Z',
        lastActiveAt: '2026-02-02T10:00:00.000Z',
        lastestActivity: null,
        grammarElo: 1000,
        vocabElo: 1000,
        readingElo: 1000,
        listeningElo: 1000,
        speakingElo: 1000,
        writingElo: 1000,
        preferredTopics: null,
        progress: {
          totalWordsTracked: 15,
          masteredWords: 5,
          learningWords: 10,
          completedTestCount: 1,
          achivievementsCount: 0,
        },
      },
    ],
    studentProgress: {
      1: [
        {
          id: 1,
          status: 'mastered',
          memoryLevel: 5,
          nextReviewDate: '2026-03-10T00:00:00.000Z',
          word: { id: 1001, headword: 'hello', meaning: 'xin chào', cefrLevel: 'A1', partOfSpeech: 'noun' },
        },
        {
          id: 2,
          status: 'learning',
          memoryLevel: 2,
          nextReviewDate: '2026-02-26T00:00:00.000Z',
          word: { id: 1002, headword: 'negotiate', meaning: 'đàm phán', cefrLevel: 'B2', partOfSpeech: 'verb' },
        },
      ],
    },
    studentAiChat: {
      1: [
        {
          id: 701,
          title: 'Luyện phỏng vấn xin việc bằng tiếng Anh',
          startedAt: '2026-02-22T15:00:00.000Z',
          messages: [
            { id: 1, sender: 'user', messageText: 'Can you help me practice for a job interview?', createdAt: '2026-02-22T15:00:10.000Z' },
            { id: 2, sender: 'ai', messageText: 'Of course! Tell me about yourself and your experience.', createdAt: '2026-02-22T15:00:15.000Z' },
          ],
        },
      ],
    },
    keywords: [
      {
        id: 'greeting',
        group: 'greeting',
        keywords: ['hello', 'hi', 'good morning', 'hey there'],
      },
      {
        id: 'farewell',
        group: 'farewell',
        keywords: ['goodbye', 'see you later', 'take care'],
      },
    ],
    aiStats: {
      totalSessions: 145,
      totalMessages: 1820,
      activeUsers: 68,
      avgMessagesPerSession: 12.5,
    },
    aiSessions: [
      {
        id: 701,
        userId: 1,
        title: 'Luyện phỏng vấn xin việc bằng tiếng Anh',
        startedAt: '2026-02-22T15:00:00.000Z',
        user: {
          id: 1,
          username: 'MinhAnh99',
          email: 'minhanh@gmail.com',
          avatarUrl: null,
          cefrLevel: 'C1',
        },
        _count: { messages: 3 },
        messages: [
          {
            messageText: 'Thank you for the interview tips!',
            sender: 'user',
            createdAt: '2026-02-22T15:05:00.000Z',
          },
        ],
      },
      {
        id: 702,
        userId: 2,
        title: 'Hỏi đáp ngữ pháp Hiện tại hoàn thành',
        startedAt: '2026-02-23T10:20:00.000Z',
        user: {
          id: 2,
          username: 'HoangNam',
          email: 'hoangnam@gmail.com',
          avatarUrl: null,
          cefrLevel: 'B2',
        },
        _count: { messages: 2 },
        messages: [
          {
            messageText: 'When should I use present perfect?',
            sender: 'user',
            createdAt: '2026-02-23T10:20:05.000Z',
          },
        ],
      },
    ],
    aiMessagesBySession: {
      701: [
        {
          id: 1,
          sessionId: 701,
          sender: 'user',
          messageText: 'Can you help me practice for a job interview?',
          createdAt: '2026-02-22T15:00:10.000Z',
        },
        {
          id: 2,
          sessionId: 701,
          sender: 'ai',
          messageText: 'Of course! Tell me about yourself and your experience.',
          createdAt: '2026-02-22T15:00:15.000Z',
        },
        {
          id: 3,
          sessionId: 701,
          sender: 'user',
          messageText: 'Thank you for the interview tips!',
          createdAt: '2026-02-22T15:05:00.000Z',
        },
      ],
      702: [
        {
          id: 4,
          sessionId: 702,
          sender: 'user',
          messageText: 'When should I use present perfect?',
          createdAt: '2026-02-23T10:20:05.000Z',
        },
        {
          id: 5,
          sessionId: 702,
          sender: 'ai',
          messageText: 'Use the present perfect for actions that started in the past and continue to the present.',
          createdAt: '2026-02-23T10:20:12.000Z',
        },
      ],
    },
    games: [
      {
        id: 1,
        code: 'BUBBLE',
        type: 'BUBBLE',
        name: 'Bắn bóng từ vựng (Bubble Shooter)',
        settings: [
          { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, penaltyPoints: 2, timeLimit: 60 },
          { difficulty: 'NORMAL', itemCount: 10, pointsPerItem: 15, penaltyPoints: 5, timeLimit: 45 },
          { difficulty: 'HARD', itemCount: 15, pointsPerItem: 20, penaltyPoints: 10, timeLimit: 30 },
        ],
      },
      {
        id: 2,
        code: 'MEMORY',
        type: 'MEMORY',
        name: 'Lật thẻ trí nhớ (Memory Flip)',
        settings: [
          { difficulty: 'EASY', itemCount: 6, pointsPerItem: 12, penaltyPoints: 2, timeLimit: 90 },
          { difficulty: 'NORMAL', itemCount: 8, pointsPerItem: 18, penaltyPoints: 5, timeLimit: 60 },
          { difficulty: 'HARD', itemCount: 12, pointsPerItem: 25, penaltyPoints: 10, timeLimit: 45 },
        ],
      },
      {
        id: 3,
        code: 'MATCHING',
        type: 'MATCHING',
        name: 'Nối từ siêu tốc (Word Matching)',
        settings: [
          { difficulty: 'EASY', itemCount: 8, pointsPerItem: 10, penaltyPoints: 0, timeLimit: 60 },
          { difficulty: 'NORMAL', itemCount: 12, pointsPerItem: 15, penaltyPoints: 0, timeLimit: 45 },
          { difficulty: 'HARD', itemCount: 16, pointsPerItem: 20, penaltyPoints: 0, timeLimit: 30 },
        ],
      },
      {
        id: 4,
        code: 'MARIO',
        type: 'MARIO',
        name: 'Mario giải cứu từ vựng',
        settings: [
          { difficulty: 'EASY', itemCount: 8, pointsPerItem: 15, penaltyPoints: 5, timeLimit: 120 },
          { difficulty: 'NORMAL', itemCount: 12, pointsPerItem: 20, penaltyPoints: 10, timeLimit: 90 },
          { difficulty: 'HARD', itemCount: 16, pointsPerItem: 30, penaltyPoints: 15, timeLimit: 60 },
        ],
      },
    ],
    achievements: [
      {
        id: 1,
        title: 'Tân Binh Chăm Chỉ',
        description: 'Đạt chuỗi học tập liên tiếp 7 ngày',
        iconUrl: 'https://dummyimage.com/64x64/f59e0b/ffffff.png&text=7D',
        requireXp: 100,
        requireStreak: 7,
      },
      {
        id: 2,
        title: 'Bậc Thầy Kinh Nghiệm',
        description: 'Tích lũy đủ 5000 điểm XP',
        iconUrl: 'https://dummyimage.com/64x64/10b981/ffffff.png&text=5K',
        requireXp: 5000,
        requireStreak: 30,
      },
    ],
    roles: [
      {
        id: 1,
        name: 'admin',
        description: 'Quản trị viên toàn quyền hệ thống',
        isSystem: true,
        userCount: 2,
        permissionCount: ALL_PERMISSION_ITEMS.length,
        permissions: ALL_PERMISSION_ITEMS,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'user',
        description: 'Học viên mặc định trên hệ thống',
        isSystem: true,
        userCount: 1250,
        permissionCount: 0,
        permissions: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        name: 'ContentEditor',
        description: 'Biên tập viên nội dung bài học và từ vựng',
        isSystem: false,
        userCount: 4,
        permissionCount: 8,
        permissions: ALL_PERMISSION_ITEMS.filter((p) => ['topics', 'courses', 'words'].includes(p.module)),
        createdAt: '2026-01-10T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
      },
    ],
    permissionsData: {
      total: ALL_PERMISSION_ITEMS.length,
      grouped: groupPermissions(ALL_PERMISSION_ITEMS),
      list: ALL_PERMISSION_ITEMS,
    },
    staff: [
      {
        id: 1,
        username: 'SuperAdmin',
        email: 'admin@english.com',
        job: 'System Administrator',
        avatarUrl: null,
        isLocked: false,
        roleId: 1,
        role: { id: 1, name: 'admin', description: 'Quản trị viên toàn quyền hệ thống', permissionCount: ALL_PERMISSION_ITEMS.length },
        isAdmin: true,
        isSelf: true,
        canModify: true,
        canDelete: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'SecondAdmin',
        email: 'admin2@english.com',
        job: 'Co-Founder Admin',
        avatarUrl: null,
        isLocked: false,
        roleId: 1,
        role: { id: 1, name: 'admin', description: 'Quản trị viên toàn quyền hệ thống', permissionCount: ALL_PERMISSION_ITEMS.length },
        isAdmin: true,
        isSelf: false,
        canModify: false,
        canDelete: false,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'EditorHung',
        email: 'hung.editor@english.com',
        job: 'Biên tập viên IELTS',
        avatarUrl: null,
        isLocked: false,
        roleId: 3,
        role: { id: 3, name: 'ContentEditor', description: 'Biên tập viên nội dung bài học và từ vựng', permissionCount: 8 },
        isAdmin: false,
        isSelf: false,
        canModify: true,
        canDelete: true,
        createdAt: '2026-01-12T00:00:00.000Z',
      },
    ],
    candidates: [
      {
        id: 101,
        username: 'MinhAnh99',
        email: 'minhanh@gmail.com',
        avatarUrl: null,
        job: 'Sinh viên ngoại ngữ',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 102,
        username: 'HoangNam',
        email: 'hoangnam@gmail.com',
        avatarUrl: null,
        job: 'Trợ giảng tự do',
        createdAt: '2026-01-15T08:00:00.000Z',
      },
    ],
    activityLogs: [
      {
        id: 1,
        actionType: 'STUDY',
        action: 'STUDY',
        description: 'Tạo chủ đề mới: Daily Conversations',
        details: 'Tạo chủ đề mới: Daily Conversations',
        ipAddress: '192.168.1.10',
        createdAt: '2026-02-24T08:30:00.000Z',
        user: { username: 'SuperAdmin', email: 'admin@english.com' },
      },
      {
        id: 2,
        actionType: 'TEST',
        action: 'TEST',
        description: 'Cập nhật khóa học: Greetings and Introductions',
        details: 'Cập nhật khóa học: Greetings and Introductions',
        ipAddress: '192.168.1.10',
        createdAt: '2026-02-24T09:15:00.000Z',
        user: { username: 'EditorHung', email: 'hung.editor@english.com' },
      },
      {
        id: 3,
        actionType: 'LOGIN',
        action: 'LOGIN',
        description: 'Xóa tạm thời từ vựng: obsolete',
        details: 'Xóa tạm thời từ vựng: obsolete',
        ipAddress: '10.0.0.25',
        createdAt: '2026-02-24T10:00:00.000Z',
        user: { username: 'SuperAdmin', email: 'admin@english.com' },
      },
    ],
    loginLogs: [
      {
        id: 1,
        ipAddress: '192.168.1.10',
        deviceInfo: 'Chrome 132 on macOS',
        loginTime: '2026-02-24T08:00:00.000Z',
        loginAt: '2026-02-24T08:00:00.000Z',
        status: 'SUCCESS',
        user: { username: 'SuperAdmin', email: 'admin@english.com' },
      },
      {
        id: 2,
        ipAddress: '203.113.142.5',
        deviceInfo: 'Safari on iPhone',
        loginTime: '2026-02-24T08:12:00.000Z',
        loginAt: '2026-02-24T08:12:00.000Z',
        status: 'SUCCESS',
        user: { username: 'EditorHung', email: 'hung.editor@english.com' },
      },
    ],
    requests: [],
    customRules: [],
    artificialDelayMs: 0,
  };
}

// 1x1 transparent PNG
const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal valid MP3 frame buffer
const TINY_MP3_BUFFER = Buffer.from(
  '//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA',
  'base64'
);

export async function handleMockRequest(req: HTTPRequest, state: MockState): Promise<boolean> {
  const urlStr = req.url();
  const method = req.method().toUpperCase();

  // Handle CORS preflight to API or external services
  if (method === 'OPTIONS' && (urlStr.includes('localhost:3000') || !urlStr.includes('localhost:5173'))) {
    await req.respond({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
    return true;
  }

  // Allow Vite local dev server assets through untouched (any 517x port)
  if (
    /^https?:\/\/localhost:517\d/.test(urlStr) ||
    /^wss?:\/\/localhost:517\d/.test(urlStr) ||
    urlStr.startsWith('data:') ||
    urlStr.startsWith('blob:')
  ) {
    return false;
  }

  // External dummy images & media
  if (
    urlStr.includes('dummyimage.com') ||
    urlStr.includes('unsplash.com') ||
    urlStr.includes('placehold.co') ||
    urlStr.includes('loremflickr.com') ||
    urlStr.includes('wikimedia.org/wikipedia') ||
    urlStr.endsWith('.png') ||
    urlStr.endsWith('.jpg')
  ) {
    await req.respond({
      status: 200,
      contentType: 'image/png',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: TINY_PNG_BUFFER,
    });
    return true;
  }

  if (urlStr.endsWith('.mp3')) {
    await req.respond({
      status: 200,
      contentType: 'audio/mpeg',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: TINY_MP3_BUFFER,
    });
    return true;
  }

  // External Dictionary & Translation & Wikimedia APIs used in AddWord / WordList
  if (urlStr.includes('api.dictionaryapi.dev/api/v2/entries/en/')) {
    const word = decodeURIComponent(urlStr.split('/').pop() || 'apple');
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify([
        {
          word,
          phonetic: `/${word}/`,
          phonetics: [
            { text: `/${word}/`, audio: `https://api.dictionaryapi.dev/media/pronunciations/en/${word}-us.mp3` },
          ],
          meanings: [
            {
              partOfSpeech: 'noun',
              definitions: [
                {
                  definition: `A sample definition for ${word}`,
                  example: `This is an example sentence with ${word}.`,
                },
              ],
            },
          ],
        },
      ]),
    });
    return true;
  }

  if (urlStr.includes('translate.googleapis.com/translate_a/single')) {
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify([[['nghĩa tiếng Việt tự động', 'sample', null, null, 1]]]),
    });
    return true;
  }

  if (urlStr.includes('api.datamuse.com/words')) {
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify([{ word: 'sample', tags: ['f:25.5'] }]),
    });
    return true;
  }

  if (urlStr.includes('en.wikipedia.org/w/api.php')) {
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({
        query: {
          pages: {
            '1': { thumbnail: { source: 'https://dummyimage.com/200x200/2563eb/ffffff.png&text=Wiki1' } },
          },
        },
      }),
    });
    return true;
  }

  if (urlStr.includes('commons.wikimedia.org/w/api.php')) {
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({
        query: {
          pages: {
            '10': { imageinfo: [{ thumburl: 'https://dummyimage.com/200x200/10b981/ffffff.png&text=Commons1' }] },
            '11': { imageinfo: [{ thumburl: 'https://dummyimage.com/200x200/f59e0b/ffffff.png&text=Commons2' }] },
          },
        },
      }),
    });
    return true;
  }

  // Handle Backend API requests (http://localhost:3000/api/...)
  if (!urlStr.includes('localhost:3000/api')) {
    await req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({}),
    });
    return true;
  }

  const parsedUrl = new URL(urlStr);
  const pathname = parsedUrl.pathname.replace(/^\/api/, '');
  const searchParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((v, k) => {
    searchParams[k] = v;
  });

  let parsedBody: any = undefined;
  const rawPostData = req.postData();
  if (rawPostData) {
    try {
      parsedBody = JSON.parse(rawPostData);
    } catch {
      parsedBody = rawPostData;
    }
  }

  const recorded: RecordedRequest = {
    method,
    url: urlStr,
    pathname,
    searchParams,
    body: parsedBody,
  };
  state.requests.push(recorded);

  if (state.artificialDelayMs > 0) {
    await new Promise((r) => setTimeout(r, state.artificialDelayMs));
  }

  // Check custom rules first
  for (let i = 0; i < state.customRules.length; i++) {
    const rule = state.customRules[i];
    const isMatch = rule.matcher
      ? rule.matcher(method, pathname, urlStr)
      : (!rule.method || rule.method.toUpperCase() === method) &&
        (!rule.pathIncludes || pathname.includes(rule.pathIncludes) || urlStr.includes(rule.pathIncludes));

    if (isMatch) {
      if (rule.once) {
        state.customRules.splice(i, 1);
      }
      const res = rule.handler
        ? await rule.handler(recorded, state)
        : { status: rule.status || 200, body: rule.body ?? {}, contentType: rule.contentType };
      await req.respond({
        status: res.status || 200,
        contentType: res.contentType || 'application/json',
        headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
        body: typeof res.body === 'string' || Buffer.isBuffer(res.body) ? res.body : JSON.stringify(res.body),
      });
      return true;
    }
  }

  const sendJson = async (status: number, payload: any) => {
    await req.respond({
      status,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify(payload),
    });
  };

  // ==================== AUTH ====================
  if (method === 'POST' && pathname === '/auth/login') {
    const { identifier, password } = parsedBody || {};
    if (identifier === 'locked@english.com') {
      await sendJson(403, { message: 'Tài khoản của bạn đã bị khóa!' });
      return true;
    }
    if (identifier === 'student@english.com') {
      await sendJson(200, {
        data: {
          accessToken: 'mock-student-token',
          user: { id: 99, username: 'StudentUser', email: 'student@english.com', role: 'user', permissions: [] },
        },
      });
      return true;
    }
    if (identifier === 'editor@english.com') {
      await sendJson(200, {
        data: {
          accessToken: 'mock-editor-token',
          user: {
            id: 3,
            username: 'EditorHung',
            email: 'editor@english.com',
            role: 'ContentEditor',
            permissions: ['READ_TOPIC_LIST', 'READ_WORD_LIST', 'READ_TOPICS', 'CREATE_TOPIC', 'READ_WORDS'],
          },
        },
      });
      return true;
    }
    if (identifier === 'admin@english.com' && password === 'Admin@123') {
      await sendJson(200, {
        data: {
          accessToken: 'mock-admin-jwt-token-2026',
          user: {
            ...state.currentAdminUser,
            permissions: state.currentPermissions,
          },
        },
      });
      return true;
    }
    await sendJson(400, { message: 'Email/Username hoặc mật khẩu không chính xác!' });
    return true;
  }

  if (method === 'POST' && pathname === '/auth/refresh') {
    await sendJson(401, { message: 'Phiên đăng nhập đã hết hạn!' });
    return true;
  }

  if (method === 'POST' && pathname === '/auth/change-password') {
    const { oldPassword, newPassword } = parsedBody || {};
    if (oldPassword === 'WrongOldPass@123') {
      await sendJson(400, { message: 'Mật khẩu hiện tại không chính xác!' });
      return true;
    }
    await sendJson(200, { success: true, message: 'Đổi mật khẩu thành công!', newPassword });
    return true;
  }

  // ==================== STAFF / ME ====================
  if (method === 'GET' && pathname === '/admin/staff/me') {
    await sendJson(200, {
      success: true,
      data: {
        ...state.currentAdminUser,
        permissions: state.currentPermissions,
      },
    });
    return true;
  }

  // ==================== NOTIFICATIONS ====================
  if (method === 'GET' && pathname === '/notifications') {
    const unreadCount = state.notifications.filter((n) => !n.isRead).length;
    await sendJson(200, {
      success: true,
      data: state.notifications,
      unreadCount,
    });
    return true;
  }

  if (method === 'PUT' && pathname === '/notifications/read-all') {
    state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'PUT' && /^\/notifications\/\d+\/read$/.test(pathname)) {
    const id = Number(pathname.split('/')[2]);
    state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'DELETE' && pathname === '/notifications/clear-all') {
    state.notifications = [];
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'DELETE' && /^\/notifications\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2]);
    state.notifications = state.notifications.filter((n) => n.id !== id);
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== DASHBOARD ====================
  if (method === 'GET' && pathname === '/admin/dashboard/stats') {
    await sendJson(200, {
      success: true,
      data: state.dashboardStats,
    });
    return true;
  }

  // ==================== TOPICS ====================
  if (method === 'GET' && pathname === '/admin/topics') {
    const { cefrLevel } = searchParams;
    let list = [...state.topics];
    if (cefrLevel) {
      list = list.filter((t) => t.cefrLevel === cefrLevel);
    }
    await sendJson(200, { success: true, data: list });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/topics') {
    const newTopic = {
      id: Date.now(),
      title: parsedBody?.title || 'Chủ đề mới',
      cefrLevel: parsedBody?.cefrLevel || 'A1',
      description: parsedBody?.description || '',
      imageUrl: parsedBody?.imageUrl || parsedBody?.coverImageUrl || null,
      coverImageUrl: parsedBody?.coverImageUrl || parsedBody?.imageUrl || null,
      lessons: [],
      totalLessons: 0,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      isDeleted: false,
    };
    state.topics.unshift(newTopic);
    await sendJson(201, { success: true, data: newTopic });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/topics\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.topics = state.topics.map((t) => (t.id === id ? { ...t, ...parsedBody } : t));
    const updated = state.topics.find((t) => t.id === id);
    await sendJson(200, { success: true, data: updated });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/topics\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.topics = state.topics.map((t) => (t.id === id ? { ...t, isDeleted: true, deletedAt: new Date().toISOString() } : t));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'PATCH' && /^\/admin\/topics\/\d+\/restore$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    state.topics = state.topics.map((t) => (t.id === id ? { ...t, isDeleted: false, deletedAt: null } : t));
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== TOPIC SETTINGS ====================
  if (method === 'GET' && pathname === '/admin/topic-settings') {
    await sendJson(200, { success: true, data: state.topicSettings });
    return true;
  }

  if (method === 'PUT' && pathname === '/admin/topic-settings') {
    state.topicSettings = {
      ...state.topicSettings,
      ...parsedBody,
    };
    await sendJson(200, { success: true, data: state.topicSettings });
    return true;
  }

  // ==================== COURSES ====================
  if (method === 'GET' && pathname === '/admin/courses/totalCourse') {
    await sendJson(200, { success: true, data: { total: state.courses.length } });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/courses') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 10);
    const search = (searchParams.search || '').toLowerCase();
    const cefrLevel = searchParams.cefrLevel || '';
    const topicId = searchParams.topicId ? Number(searchParams.topicId) : null;

    let filtered = [...state.courses];
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search)
      );
    }
    if (cefrLevel) {
      filtered = filtered.filter((c) => c.cefrLevel === cefrLevel);
    }
    if (topicId) {
      filtered = filtered.filter((c) => Number(c.topicId) === topicId);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      data: {
        items,
        courses: items,
        pagination: { total, page, limit, totalPages },
      },
    });
    return true;
  }

  if (method === 'GET' && /^\/admin\/courses\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const course = state.courses.find((c) => c.id === id);
    if (!course) {
      await sendJson(404, { success: false, message: 'Không tìm thấy bài học!' });
      return true;
    }
    await sendJson(200, { success: true, data: course });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/courses') {
    const topicObj = state.topics.find((t) => t.id === Number(parsedBody?.topicId)) || state.topics[0];
    const newCourse = {
      id: Date.now(),
      title: parsedBody?.title || 'Bài học mới',
      cefrLevel: parsedBody?.cefrLevel || 'A1',
      topicId: Number(parsedBody?.topicId) || 1,
      topic: topicObj ? { id: topicObj.id, title: topicObj.title, isDeleted: topicObj.isDeleted } : { id: 1, title: 'Daily Conversations', isDeleted: false },
      description: parsedBody?.description || '',
      thumbnailUrl: parsedBody?.thumbnailUrl || parsedBody?.imageUrl || null,
      imageUrl: parsedBody?.imageUrl || parsedBody?.thumbnailUrl || null,
      videoUrl: parsedBody?.videoUrl || '',
      content: parsedBody?.content || '',
      createdAt: new Date().toISOString(),
      deletedAt: null,
      isDeleted: false,
      isTopicDeleted: false,
      words: [],
    };
    state.courses.unshift(newCourse);
    await sendJson(201, { success: true, data: newCourse });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/courses\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.courses = state.courses.map((c) => {
      if (c.id !== id) return c;
      const topicObj = state.topics.find((t) => t.id === Number(parsedBody?.topicId ?? c.topicId));
      return {
        ...c,
        ...parsedBody,
        topic: topicObj ? { id: topicObj.id, title: topicObj.title, isDeleted: topicObj.isDeleted } : c.topic,
      };
    });
    const updated = state.courses.find((c) => c.id === id);
    await sendJson(200, { success: true, data: updated });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/courses\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.courses = state.courses.map((c) => (c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() } : c));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'PATCH' && /^\/admin\/courses\/\d+\/restore$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    state.courses = state.courses.map((c) => (c.id === id ? { ...c, isDeleted: false, deletedAt: null, isTopicDeleted: false } : c));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'POST' && /^\/admin\/courses\/\d+\/words$/.test(pathname)) {
    const courseId = Number(pathname.split('/')[3]);
    const wordIds: number[] = parsedBody?.wordIds || [];
    state.courses = state.courses.map((c) => {
      if (c.id !== courseId) return c;
      const existingIds = new Set((c.words || []).map((w: any) => w.wordId || w.word?.id || w.id));
      const added = wordIds
        .filter((wid) => !existingIds.has(wid))
        .map((wid) => {
          const wObj = state.words.find((w) => w.id === wid) || {
            id: wid,
            headword: `word-${wid}`,
            partOfSpeech: 'noun',
            cefrLevel: 'A1',
            meaning: 'từ mới gán',
            meaningVi: 'từ mới gán',
          };
          return { wordId: wid, word: wObj };
        });
      return { ...c, words: [...(c.words || []), ...added] };
    });
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/courses\/\d+\/words\/\d+$/.test(pathname)) {
    const parts = pathname.split('/');
    const courseId = Number(parts[3]);
    const wordId = Number(parts[5]);
    state.courses = state.courses.map((c) => {
      if (c.id !== courseId) return c;
      return { ...c, words: (c.words || []).filter((w: any) => Number(w.wordId) !== wordId && Number(w.word?.id) !== wordId && Number(w.id) !== wordId) };
    });
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== WORDS ====================
  if (method === 'GET' && pathname === '/admin/word/totalWord') {
    await sendJson(200, { success: true, data: { total: state.words.length } });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/word') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 10);
    const search = (searchParams.search || '').trim().toLowerCase();
    const cefrLevel = searchParams.cefrLevel || '';
    const partOfSpeech = searchParams.partOfSpeech || '';
    const hasImage = searchParams.hasImage || 'all';
    const hasAudio = searchParams.hasAudio || 'all';
    const sortBy = searchParams.sortBy || 'id';
    const sortOrder = searchParams.sortOrder || 'asc';

    let filtered = [...state.words];
    if (search) {
      filtered = filtered.filter(
        (w) =>
          w.headword.toLowerCase().includes(search) ||
          (w.meaning || '').toLowerCase().includes(search) ||
          (w.meaningVi || '').toLowerCase().includes(search)
      );
    }
    if (cefrLevel && cefrLevel !== 'all') {
      filtered = filtered.filter((w) => w.cefrLevel === cefrLevel);
    }
    if (partOfSpeech && partOfSpeech !== 'all') {
      filtered = filtered.filter((w) => w.partOfSpeech.toLowerCase() === partOfSpeech.toLowerCase());
    }
    if (hasImage === 'yes') {
      filtered = filtered.filter((w) => Boolean(w.imageUrl));
    } else if (hasImage === 'no') {
      filtered = filtered.filter((w) => !w.imageUrl);
    }
    if (hasAudio === 'yes') {
      filtered = filtered.filter((w) => Boolean(w.audioUrl));
    } else if (hasAudio === 'no') {
      filtered = filtered.filter((w) => !w.audioUrl);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'id') {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      }
      const valA = String(a[sortBy] || '').toLowerCase();
      const valB = String(b[sortBy] || '').toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      data: items,
      meta: { totalItems: total, page, limit, totalPages },
    });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/word') {
    const headword = (parsedBody?.headword || '').trim();
    const duplicate = state.words.find(
      (w) =>
        w.headword.toLowerCase() === headword.toLowerCase() &&
        w.partOfSpeech.toLowerCase() === (parsedBody?.partOfSpeech || 'noun').toLowerCase()
    );
    if (duplicate) {
      await sendJson(409, { success: false, message: `Từ vựng "${headword}" đã tồn tại trong hệ thống!` });
      return true;
    }
    const meaningVal = parsedBody?.meaning || parsedBody?.meaningVi || '';
    const exampleVal = parsedBody?.exampleSentence || parsedBody?.exampleEn || '';
    const newWord = {
      id: Date.now(),
      headword,
      phonetic: parsedBody?.phonetic || `/${headword}/`,
      partOfSpeech: parsedBody?.partOfSpeech || 'noun',
      cefrLevel: parsedBody?.cefrLevel || 'A1',
      meaning: meaningVal,
      meaningVi: meaningVal,
      exampleSentence: exampleVal,
      exampleEn: exampleVal,
      exampleVi: parsedBody?.exampleVi || '',
      imageUrl: parsedBody?.imageUrl || null,
      audioUrl: parsedBody?.audioUrl || null,
      listeningCode: parsedBody?.listeningCode || 'CODE01',
      deletedAt: null,
      isDeleted: false,
    };
    state.words.unshift(newWord);
    await sendJson(201, { success: true, data: newWord });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/word/bulk') {
    const items = Array.isArray(parsedBody) ? parsedBody : parsedBody?.words || [];
    const created = items.map((item: any, idx: number) => ({
      id: Date.now() + idx,
      headword: item.headword || `bulk-${idx}`,
      phonetic: item.phonetic || '',
      partOfSpeech: item.partOfSpeech || 'noun',
      cefrLevel: item.cefrLevel || 'A1',
      meaning: item.meaning || item.meaningVi || 'nghĩa tiếng Việt',
      meaningVi: item.meaning || item.meaningVi || 'nghĩa tiếng Việt',
      exampleSentence: item.exampleSentence || item.exampleEn || '',
      exampleEn: item.exampleSentence || item.exampleEn || '',
      exampleVi: item.exampleVi || '',
      imageUrl: item.imageUrl || null,
      audioUrl: item.audioUrl || null,
      listeningCode: item.listeningCode || '',
      deletedAt: null,
      isDeleted: false,
    }));
    state.words.unshift(...created);
    await sendJson(201, {
      success: true,
      data: {
        insertedCount: created.length,
        skippedCount: 0,
      },
    });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/word\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.words = state.words.map((w) => {
      if (w.id !== id) return w;
      const meaningVal = parsedBody?.meaning ?? parsedBody?.meaningVi ?? w.meaning;
      return { ...w, ...parsedBody, meaning: meaningVal, meaningVi: meaningVal };
    });
    const updated = state.words.find((w) => w.id === id);
    await sendJson(200, { success: true, data: updated });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/word\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.words = state.words.map((w) => (w.id === id ? { ...w, isDeleted: true, deletedAt: new Date().toISOString() } : w));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'PATCH' && /^\/admin\/word\/\d+\/restore$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    state.words = state.words.map((w) => (w.id === id ? { ...w, isDeleted: false, deletedAt: null } : w));
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== TESTS & QUESTIONS & RESULTS ====================
  if (method === 'GET' && pathname === '/admin/tests') {
    const { ceftLevel, search, lessonId, type } = searchParams;
    let list = [...state.tests];
    if (lessonId !== undefined) {
      list = list.filter((t) => Number(t.lessonId) === Number(lessonId));
      await sendJson(200, { success: true, data: list });
      return true;
    }
    if (type === 'placement') {
      list = list.filter((t) => !t.lessonId);
    } else if (type === 'lesson') {
      list = list.filter((t) => Boolean(t.lessonId));
    }
    if (ceftLevel) {
      list = list.filter((t) => t.ceftLevel === ceftLevel || (t.ceftLevel || '').startsWith(ceftLevel));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    await sendJson(200, {
      success: true,
      data: {
        items: list,
        pagination: { total: list.length, page: 1, limit: 12, totalPages: 1 },
        counts: {
          placement: state.tests.filter((t) => !t.lessonId).length,
          lesson: state.tests.filter((t) => Boolean(t.lessonId)).length,
          all: state.tests.length,
        },
      },
    });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/tests') {
    const newTest = {
      id: Date.now(),
      title: parsedBody?.title || 'Đề thi mới',
      description: parsedBody?.description || '',
      ceftLevel: parsedBody?.ceftLevel || 'A1-A2',
      lessonId: parsedBody?.lessonId ?? null,
      durationInMinutes: Number(parsedBody?.durationInMinutes || 20),
      passingScore: Number(parsedBody?.passingScore || 60),
      totalQuestions: Number(parsedBody?.totalQuestions || 10),
      createdAt: new Date().toISOString(),
      _count: { questions: 0 },
    };
    state.tests.unshift(newTest);
    state.questionsByTest[newTest.id] = [];
    await sendJson(201, { success: true, data: newTest });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/tests\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.tests = state.tests.map((t) => (t.id === id ? { ...t, ...parsedBody } : t));
    const updated = state.tests.find((t) => t.id === id);
    await sendJson(200, { success: true, data: updated });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/tests\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.tests = state.tests.filter((t) => t.id !== id);
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/tests/upload-media') {
    await sendJson(200, {
      success: true,
      data: { url: 'https://dummyimage.com/120x80/2563eb/ffffff.png&text=UploadedMedia' },
    });
    return true;
  }

  if (method === 'GET' && /^\/admin\/tests\/\d+\/questions$/.test(pathname)) {
    const testId = Number(pathname.split('/')[3]);
    const questions = state.questionsByTest[testId] || [];
    await sendJson(200, {
      success: true,
      data: questions,
    });
    return true;
  }

  if (method === 'POST' && /^\/admin\/tests\/\d+\/questions$/.test(pathname)) {
    const testId = Number(pathname.split('/')[3]);
    const qText = parsedBody?.quesionText || parsedBody?.questionText || '';
    const newQ = {
      id: Date.now(),
      testId,
      skillCategory: parsedBody?.skillCategory || 'Vocabulary',
      skill: (parsedBody?.skillCategory || 'reading').toLowerCase(),
      questionType: parsedBody?.questionType || 'multiple_choice',
      quesionText: qText,
      questionText: qText,
      points: Number(parsedBody?.points || 10),
      difficultyElo: Number(parsedBody?.difficultyElo || 1200),
      topic: parsedBody?.topic || '',
      audioUrl: parsedBody?.audioUrl || '',
      mediaUrl: parsedBody?.audioUrl || null,
      imageUrl: parsedBody?.imageUrl || '',
      answers: (parsedBody?.answers || []).map((a: any, i: number) => ({
        id: Date.now() + i + 1,
        answerText: a.answerText,
        isCorrect: Boolean(a.isCorrect),
      })),
    };
    if (!state.questionsByTest[testId]) state.questionsByTest[testId] = [];
    state.questionsByTest[testId].push(newQ);
    await sendJson(201, { success: true, data: newQ });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/tests\/\d+\/questions\/\d+$/.test(pathname)) {
    const parts = pathname.split('/');
    const testId = Number(parts[3]);
    const qId = Number(parts[5]);
    const list = state.questionsByTest[testId] || [];
    const qText = parsedBody?.quesionText ?? parsedBody?.questionText;
    state.questionsByTest[testId] = list.map((q) =>
      q.id === qId ? { ...q, ...parsedBody, quesionText: qText ?? q.quesionText, questionText: qText ?? q.questionText } : q
    );
    const updated = state.questionsByTest[testId].find((q) => q.id === qId);
    await sendJson(200, { success: true, data: updated });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/tests\/\d+\/questions\/\d+$/.test(pathname)) {
    const parts = pathname.split('/');
    const testId = Number(parts[3]);
    const qId = Number(parts[5]);
    const list = state.questionsByTest[testId] || [];
    state.questionsByTest[testId] = list.filter((q) => q.id !== qId);
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'POST' && /^\/admin\/tests\/\d+\/questions\/import$/.test(pathname)) {
    const testId = Number(pathname.split('/')[3]);
    const importedQ = {
      id: Date.now(),
      testId,
      skillCategory: 'Grammar',
      skill: 'grammar',
      questionType: 'multiple_choice',
      quesionText: 'Imported Question from Excel: Choose the correct verb form.',
      questionText: 'Imported Question from Excel: Choose the correct verb form.',
      points: 10,
      difficultyElo: 1250,
      topic: 'Grammar',
      audioUrl: '',
      imageUrl: '',
      answers: [
        { id: Date.now() + 1, answerText: 'goes', isCorrect: true },
        { id: Date.now() + 2, answerText: 'go', isCorrect: false },
      ],
    };
    if (!state.questionsByTest[testId]) state.questionsByTest[testId] = [];
    state.questionsByTest[testId].push(importedQ);
    await sendJson(200, { success: true, data: { imported: 1 } });
    return true;
  }

  if (method === 'GET' && /^\/admin\/tests\/\d+\/results$/.test(pathname)) {
    const testId = Number(pathname.split('/')[3]);
    const results = state.testResultsByTest[testId] || [];
    const testObj = state.tests.find((t) => t.id === testId) || { id: testId, title: `Bài thi #${testId}`, passingScore: 50 };
    await sendJson(200, {
      success: true,
      data: {
        test: testObj,
        results,
      },
    });
    return true;
  }

  // ==================== STUDENTS ====================
  if (method === 'GET' && pathname === '/admin/students/totalStudent') {
    await sendJson(200, { success: true, data: { total: state.students.length } });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/students/top') {
    const limit = Number(searchParams.limit || 5);
    const topSource = state.dashboardStats?.topStudents?.length
      ? state.dashboardStats.topStudents
      : state.students;
    await sendJson(200, {
      success: true,
      data: topSource.slice(0, limit),
    });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/students') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 10);
    const search = (searchParams.search || '').toLowerCase();
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder || 'desc';

    let list = [...state.students];
    if (search) {
      list = list.filter(
        (s) =>
          s.username.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          (s.fullName || '').toLowerCase().includes(search)
      );
    }

    list.sort((a, b) => {
      const vA = a[sortBy] ?? 0;
      const vB = b[sortBy] ?? 0;
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      message: 'OK',
      data: {
        items,
        pagination: {
          totalItems,
          currentPage: page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
    return true;
  }

  if (method === 'GET' && /^\/admin\/students\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const student = state.students.find((s) => s.id === id) || state.students[0];
    await sendJson(200, {
      success: true,
      message: 'OK',
      data: {
        profile: {
          id: student.id,
          username: student.username,
          email: student.email,
          avatarUrl: student.avatarUrl,
          xpPoints: student.xpPoints,
          isLocked: student.isLocked,
          cefrLevel: student.cefrLevel,
          grammarElo: student.grammarElo ?? 1520,
          vocabElo: student.vocabElo ?? 1560,
          readingElo: student.readingElo ?? 1620,
          listeningElo: student.listeningElo ?? 1580,
          preferredTopics: student.preferredTopics ?? '1,2',
          lastLoginDate: student.lastLoginDate,
          joinedAt: student.joinedAt || student.createdAt,
        },
        progressSummary: {
          totalWords: student.progress?.totalWordsTracked ?? 620,
          masteredWords: student.progress?.masteredWords ?? 480,
          learningWords: student.progress?.learningWords ?? 140,
          testsCompleted: student.progress?.completedTestCount ?? 12,
          averageTestScore: 85,
          achievementsUnlocked: student.progress?.achivievementsCount ?? 2,
        },
        recentTests: [
          {
            id: 901,
            testId: 201,
            totalScore: 85,
            completedAt: '2026-02-20T09:30:00.000Z',
            test: { id: 201, title: 'Placement Test Toàn Diện 2026', ceftLevel: 'ALL' },
          },
        ],
        recentActivities: [],
        achievements: state.achievements,
      },
    });
    return true;
  }

  if (method === 'GET' && /^\/admin\/students\/\d+\/progress$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    await sendJson(200, { success: true, data: state.studentProgress[id] || state.studentProgress[1] || [] });
    return true;
  }

  if (method === 'GET' && /^\/admin\/students\/\d+\/ai-chat$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    await sendJson(200, { success: true, data: state.studentAiChat[id] || state.studentAiChat[1] || [] });
    return true;
  }

  if (method === 'PATCH' && /^\/admin\/students\/\d+\/status$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    const isLocked = Boolean(parsedBody?.isLocked);
    state.students = state.students.map((s) => (s.id === id ? { ...s, isLocked } : s));
    await sendJson(200, {
      success: true,
      message: isLocked ? 'Đã khóa tài khoản học viên thành công!' : 'Đã mở khóa tài khoản học viên thành công!',
      data: state.students.find((s) => s.id === id),
    });
    return true;
  }

  // ==================== KEYWORDS ====================
  if (method === 'GET' && pathname === '/admin/keywords/download') {
    await req.respond({
      status: 200,
      contentType: 'text/csv',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: 'group,keywords\ngreeting,"hello,hi,good morning"\n',
    });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/keywords') {
    await sendJson(200, { success: true, data: state.keywords });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/keywords') {
    const group = (parsedBody?.group || '').trim();
    const kwRaw = parsedBody?.keywords;
    const keywords = Array.isArray(kwRaw)
      ? kwRaw
      : String(kwRaw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const newKw = { id: group || `kw-${Date.now()}`, group, keywords };
    state.keywords.push(newKw);
    await sendJson(201, { success: true, data: newKw });
    return true;
  }

  if (method === 'PUT' && pathname.startsWith('/admin/keywords/')) {
    const id = decodeURIComponent(pathname.replace('/admin/keywords/', ''));
    const group = (parsedBody?.group || id).trim();
    const kwRaw = parsedBody?.keywords;
    const keywords = Array.isArray(kwRaw)
      ? kwRaw
      : String(kwRaw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    state.keywords = state.keywords.map((k) => (k.id === id || k.group === id ? { id: group, group, keywords } : k));
    await sendJson(200, { success: true });
    return true;
  }

  if (method === 'DELETE' && pathname.startsWith('/admin/keywords/')) {
    const id = decodeURIComponent(pathname.replace('/admin/keywords/', ''));
    state.keywords = state.keywords.filter((k) => k.id !== id && k.group !== id);
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== AI CHAT ====================
  if (method === 'GET' && pathname === '/ai/admin/stats') {
    await sendJson(200, { success: true, data: state.aiStats });
    return true;
  }

  if (method === 'GET' && pathname === '/ai/admin/sessions') {
    const search = (searchParams.search || '').toLowerCase();
    let list = [...state.aiSessions];
    if (search) {
      list = list.filter(
        (s) =>
          (s.title || '').toLowerCase().includes(search) ||
          (s.user?.username || '').toLowerCase().includes(search) ||
          (s.user?.email || '').toLowerCase().includes(search)
      );
    }
    await sendJson(200, { success: true, data: list });
    return true;
  }

  if (method === 'GET' && /^\/ai\/admin\/sessions\/\d+\/messages$/.test(pathname)) {
    const sessionId = Number(pathname.split('/')[4]);
    await sendJson(200, {
      success: true,
      data: state.aiMessagesBySession[sessionId] || state.aiMessagesBySession[701] || [],
    });
    return true;
  }

  if (method === 'DELETE' && /^\/ai\/admin\/sessions\/\d+$/.test(pathname)) {
    const sessionId = Number(pathname.split('/')[4]);
    state.aiSessions = state.aiSessions.filter((s) => s.id !== sessionId);
    await sendJson(200, { success: true, message: 'Đã xóa phiên hội thoại AI' });
    return true;
  }

  // ==================== GAMES ====================
  if (method === 'GET' && pathname === '/games/admin') {
    await sendJson(200, { success: true, data: state.games });
    return true;
  }

  if (method === 'PUT' && /^\/games\/admin\/\d+\/settings$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    state.games = state.games.map((g) => (g.id === id ? { ...g, settings: parsedBody?.settings || g.settings } : g));
    await sendJson(200, { success: true, data: state.games.find((g) => g.id === id) });
    return true;
  }

  // ==================== ACHIEVEMENTS ====================
  if (method === 'GET' && pathname === '/admin/achievements') {
    await sendJson(200, { success: true, data: state.achievements });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/achievements') {
    const newAch = {
      id: Date.now(),
      title: parsedBody?.title || 'Danh hiệu mới',
      description: parsedBody?.description || '',
      iconUrl: parsedBody?.iconUrl || 'https://dummyimage.com/64x64/2563eb/ffffff.png&text=New',
      requireXp: Number(parsedBody?.requireXp ?? 100),
      requireStreak: Number(parsedBody?.requireStreak ?? 7),
    };
    state.achievements.push(newAch);
    await sendJson(201, { success: true, data: newAch });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/achievements\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.achievements = state.achievements.map((a) => (a.id === id ? { ...a, ...parsedBody } : a));
    await sendJson(200, { success: true, data: state.achievements.find((a) => a.id === id) });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/achievements\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.achievements = state.achievements.filter((a) => a.id !== id);
    await sendJson(200, { success: true });
    return true;
  }

  // ==================== ROLES ====================
  if (method === 'GET' && pathname === '/admin/roles/permissions') {
    await sendJson(200, { success: true, data: state.permissionsData });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/roles') {
    await sendJson(200, { success: true, data: state.roles });
    return true;
  }

  if (method === 'GET' && /^\/admin\/roles\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const role = state.roles.find((r) => r.id === id);
    await sendJson(200, { success: true, data: role });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/roles') {
    const permIds: number[] = parsedBody?.permissionIds || [];
    const perms = ALL_PERMISSION_ITEMS.filter((p) => permIds.includes(p.id));
    const newRole = {
      id: Date.now(),
      name: parsedBody?.name || 'CustomRole',
      description: parsedBody?.description || '',
      isSystem: false,
      userCount: 0,
      permissionCount: perms.length,
      permissions: perms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.roles.push(newRole);
    await sendJson(201, { success: true, data: newRole });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/roles\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const permIds: number[] | undefined = parsedBody?.permissionIds;
    state.roles = state.roles.map((r) => {
      if (r.id !== id) return r;
      const perms = permIds ? ALL_PERMISSION_ITEMS.filter((p) => permIds.includes(p.id)) : r.permissions;
      return {
        ...r,
        name: parsedBody?.name ?? r.name,
        description: parsedBody?.description ?? r.description,
        permissions: perms,
        permissionCount: perms.length,
      };
    });
    await sendJson(200, { success: true, data: state.roles.find((r) => r.id === id) });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/roles\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.roles = state.roles.filter((r) => r.id !== id);
    await sendJson(200, { success: true, message: 'Xóa vai trò thành công' });
    return true;
  }

  // ==================== STAFF ====================
  if (method === 'GET' && pathname === '/admin/staff/candidates') {
    const q = (searchParams.search || '').toLowerCase();
    const list = state.candidates.filter(
      (c) => c.username.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
    await sendJson(200, { success: true, data: list });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/staff/promote-user') {
    const cand = state.candidates.find((c) => c.id === Number(parsedBody?.userId)) || state.candidates[0];
    const roleObj = state.roles.find((r) => r.id === Number(parsedBody?.roleId)) || state.roles[2];
    const newStaff = {
      id: cand.id,
      username: cand.username,
      email: cand.email,
      job: cand.job || 'Nhân viên mới thăng cấp',
      avatarUrl: null,
      isLocked: false,
      roleId: roleObj.id,
      role: { id: roleObj.id, name: roleObj.name, description: roleObj.description, permissionCount: roleObj.permissionCount },
      isAdmin: roleObj.name === 'admin',
      isSelf: false,
      canModify: true,
      canDelete: roleObj.name !== 'admin',
      createdAt: new Date().toISOString(),
    };
    state.staff.push(newStaff);
    await sendJson(200, { success: true, message: 'Thăng cấp học viên thành công', data: newStaff });
    return true;
  }

  if (method === 'POST' && /^\/admin\/staff\/\d+\/promote-admin$/.test(pathname)) {
    const id = Number(pathname.split('/')[3]);
    const adminRole = state.roles[0];
    state.staff = state.staff.map((s) =>
      s.id === id
        ? {
            ...s,
            roleId: adminRole.id,
            role: { id: adminRole.id, name: 'admin', description: adminRole.description, permissionCount: adminRole.permissionCount },
            isAdmin: true,
          }
        : s
    );
    await sendJson(200, {
      success: true,
      message: 'Đã nâng cấp lên Quản trị viên (Admin)',
      data: state.staff.find((s) => s.id === id),
    });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/staff') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 10);
    const search = (searchParams.search || '').toLowerCase();
    const roleId = searchParams.roleId ? Number(searchParams.roleId) : null;
    const isLocked = searchParams.isLocked !== undefined ? searchParams.isLocked === 'true' : null;

    let list = [...state.staff];
    if (search) {
      list = list.filter(
        (s) =>
          s.username.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          (s.job || '').toLowerCase().includes(search)
      );
    }
    if (roleId) {
      list = list.filter((s) => s.roleId === roleId);
    }
    if (isLocked !== null) {
      list = list.filter((s) => s.isLocked === isLocked);
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const staff = list.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      data: {
        staff,
        pagination: { total, page, limit, totalPages },
      },
    });
    return true;
  }

  if (method === 'GET' && /^\/admin\/staff\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const st = state.staff.find((s) => s.id === id) || state.staff[0];
    const roleObj = state.roles.find((r) => r.id === st.roleId) || state.roles[0];
    await sendJson(200, {
      success: true,
      data: {
        ...st,
        role: {
          ...st.role,
          permissions: roleObj.permissions || ALL_PERMISSION_ITEMS,
        },
      },
    });
    return true;
  }

  if (method === 'POST' && pathname === '/admin/staff') {
    const roleObj = state.roles.find((r) => r.id === Number(parsedBody?.roleId)) || state.roles[2];
    const newStaff = {
      id: Date.now(),
      username: parsedBody?.username || 'new_staff',
      email: parsedBody?.email || 'staff@english.com',
      job: parsedBody?.job || 'Nhân viên nội dung',
      avatarUrl: null,
      isLocked: false,
      roleId: roleObj.id,
      role: { id: roleObj.id, name: roleObj.name, description: roleObj.description, permissionCount: roleObj.permissionCount },
      isAdmin: roleObj.name === 'admin',
      isSelf: false,
      canModify: true,
      canDelete: roleObj.name !== 'admin',
      createdAt: new Date().toISOString(),
    };
    state.staff.unshift(newStaff);
    await sendJson(201, { success: true, data: newStaff });
    return true;
  }

  if (method === 'PUT' && /^\/admin\/staff\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.staff = state.staff.map((s) => {
      if (s.id !== id) return s;
      const roleObj = parsedBody?.roleId ? state.roles.find((r) => r.id === Number(parsedBody.roleId)) : null;
      return {
        ...s,
        username: parsedBody?.username ?? s.username,
        email: parsedBody?.email ?? s.email,
        job: parsedBody?.job ?? s.job,
        isLocked: parsedBody?.isLocked ?? s.isLocked,
        roleId: roleObj ? roleObj.id : s.roleId,
        role: roleObj
          ? { id: roleObj.id, name: roleObj.name, description: roleObj.description, permissionCount: roleObj.permissionCount }
          : s.role,
        isAdmin: roleObj ? roleObj.name === 'admin' : s.isAdmin,
      };
    });
    await sendJson(200, { success: true, data: state.staff.find((s) => s.id === id) });
    return true;
  }

  if (method === 'DELETE' && /^\/admin\/staff\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    state.staff = state.staff.filter((s) => s.id !== id);
    await sendJson(200, { success: true, message: 'Xóa tài khoản nhân viên thành công' });
    return true;
  }

  // ==================== SYSTEM LOGS ====================
  if (method === 'GET' && pathname === '/admin/logs/activities') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 20);
    const search = (searchParams.search || '').toLowerCase();
    const actionType = searchParams.actionType || '';

    let list = [...state.activityLogs];
    if (search) {
      list = list.filter(
        (l) =>
          l.description.toLowerCase().includes(search) ||
          l.ipAddress.toLowerCase().includes(search) ||
          (l.user?.username || '').toLowerCase().includes(search)
      );
    }
    if (actionType) {
      list = list.filter((l) => l.actionType === actionType);
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      data: {
        items,
        logs: items,
        pagination: { total, page, limit, totalPages },
      },
    });
    return true;
  }

  if (method === 'GET' && pathname === '/admin/logs/login-logs') {
    const page = Number(searchParams.page || 1);
    const limit = Number(searchParams.limit || 20);
    const search = (searchParams.search || '').toLowerCase();

    let list = [...state.loginLogs];
    if (search) {
      list = list.filter(
        (l) =>
          l.ipAddress.toLowerCase().includes(search) ||
          l.deviceInfo.toLowerCase().includes(search) ||
          (l.user?.username || '').toLowerCase().includes(search)
      );
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    await sendJson(200, {
      success: true,
      data: {
        items,
        logs: items,
        pagination: { total, page, limit, totalPages },
      },
    });
    return true;
  }

  // Fallback
  await sendJson(200, { success: true, data: {} });
  return true;
}
