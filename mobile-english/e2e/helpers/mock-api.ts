/**
 * Mock API Database & Handlers for Mobile English E2E Tests
 * Mirroring backend-api schemas and responses
 */

export interface MockState {
  users: Array<{
    id: number;
    username: string;
    email: string;
    roleId: number;
    job?: string;
    interests?: string;
    avatarUrl?: string;
    cefrLevel?: string;
    onboardingCompleted: boolean;
    xpPoints: number;
    streakDays: number;
    isLocked: boolean;
    grammarElo: number;
    vocabElo: number;
    readingElo: number;
    listeningElo: number;
  }>;
  courses: Array<{
    id: number;
    topicId: number;
    title: string;
    description: string;
    cefrLevel: string;
    thumbnailUrl: string;
    lessonsCount: number;
    isEnrolled: boolean;
    isCompleted: boolean;
    progressPercent: number;
  }>;
  lessons: Array<{
    id: number;
    courseId: number;
    title: string;
    description: string;
    content: string;
    videoUrl: string;
    cefrLevel: string;
    isLocked: boolean;
    isCompleted: boolean;
    words: Array<{
      id: number;
      headword: string;
      partOfSpeech: string;
      phonetic: string;
      meaning: string;
      exampleSentence: string;
      audioUrl: string;
      imageUrl: string;
      isBookmarked?: boolean;
    }>;
  }>;
  tests: Array<{
    id: number;
    lessonId?: number;
    title: string;
    description: string;
    cefrLevel: string;
    timeLimitMin: number;
    passingScore: number;
    type: 'placement_test' | 'lesson_practice';
    questions: Array<{
      id: number;
      questionText: string;
      questionType: 'multiple_choice' | 'fill_in_blank' | 'listening' | 'speaking' | 'writing';
      skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Listening';
      eloRating: number;
      audioUrl?: string;
      answers: Array<{ id: number; text: string; isCorrect: boolean }>;
      explanation: string;
    }>;
  }>;
  games: {
    bubble: { code: 'BUBBLE'; maxScore: number; playedCount: number };
    memory: { code: 'MEMORY'; maxScore: number; playedCount: number };
    matching: { code: 'MATCHING'; maxScore: number; playedCount: number };
    mario: { code: 'MARIO'; maxScore: number; playedCount: number };
  };
  communityPosts: Array<{
    id: number;
    userId: number;
    authorName: string;
    authorAvatar: string;
    content: string;
    imageUrl?: string;
    isPublic: boolean;
    createdAt: string;
    likesCount: number;
    isLiked: boolean;
    comments: Array<{
      id: number;
      userId: number;
      authorName: string;
      authorAvatar: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  savedWords: Array<{
    id: number;
    wordId: number;
    headword: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    cefrLevel: string;
    audioUrl: string;
    memoryLevel: number;
    nextReviewDate: string;
    isDueToday: boolean;
  }>;
  quests: Array<{
    id: number;
    title: string;
    targetCount: number;
    currentCount: number;
    rewardXp: number;
    isClaimed: boolean;
  }>;
  notifications: Array<{
    id: number;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }>;
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    iconUrl: string;
    isUnlocked: boolean;
    unlockedAt?: string;
    progress: number;
    target: number;
    rewardXp: number;
  }>;
  aiChatSessions: Array<{
    id: number;
    title: string;
    lastMessage: string;
    updatedAt: string;
    messages: Array<{ id: number; sender: 'user' | 'ai'; text: string; createdAt: string }>;
  }>;
  loginAttempts: Record<string, number>;
  requests: Array<{ method: string; pathname: string; body?: any }>;
}

export function createDefaultMockState(): MockState {
  return {
    users: [
      {
        id: 1,
        username: 'hocvien_chuan',
        email: 'hocvien@english.com',
        roleId: 2,
        job: 'Công nghệ thông tin',
        interests: 'Công nghệ, Du lịch',
        avatarUrl: 'https://ui-avatars.com/api/?name=Hoc+Vien',
        cefrLevel: 'B1',
        onboardingCompleted: true,
        xpPoints: 450,
        streakDays: 5,
        isLocked: false,
        grammarElo: 1250,
        vocabElo: 1300,
        readingElo: 1180,
        listeningElo: 1100,
      },
      {
        id: 2,
        username: 'hocvien_moi',
        email: 'moi@english.com',
        roleId: 2,
        onboardingCompleted: false,
        xpPoints: 0,
        streakDays: 0,
        isLocked: false,
        grammarElo: 1200,
        vocabElo: 1200,
        readingElo: 1200,
        listeningElo: 1200,
      },
    ],
    courses: [
      {
        id: 1,
        topicId: 1,
        title: 'Giao tiếp hàng ngày (Daily English)',
        description: 'Tự tin giao tiếp các tình huống hàng ngày',
        cefrLevel: 'A1',
        thumbnailUrl: 'https://placehold.co/400x250/png?text=Daily+English',
        lessonsCount: 5,
        isEnrolled: true,
        isCompleted: false,
        progressPercent: 25,
      },
      {
        id: 2,
        topicId: 2,
        title: 'Tiếng Anh Du lịch (Travel & Tourism)',
        description: 'Khám phá thế giới với vốn tiếng Anh thông dụng',
        cefrLevel: 'B1',
        thumbnailUrl: 'https://placehold.co/400x250/png?text=Travel+English',
        lessonsCount: 8,
        isEnrolled: false,
        isCompleted: false,
        progressPercent: 0,
      },
      {
        id: 3,
        topicId: 3,
        title: 'Advanced Business Communication',
        description: 'Thuyết trình, đàm phán và soạn thảo hợp đồng chuyên nghiệp',
        cefrLevel: 'B2',
        thumbnailUrl: 'https://placehold.co/400x250/png?text=Business+English',
        lessonsCount: 10,
        isEnrolled: false,
        isCompleted: false,
        progressPercent: 0,
      },
    ],
    lessons: [
      {
        id: 10,
        courseId: 1,
        title: 'Bài 1: Greeting & Introduction',
        description: 'Cách chào hỏi và giới thiệu bản thân bằng tiếng Anh',
        content: '<h3>Lý thuyết Ngữ pháp</h3><p>Cấu trúc: <b>I am + Tên/Nghề nghiệp</b></p>',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        cefrLevel: 'A1',
        isLocked: false,
        isCompleted: false,
        words: [
          {
            id: 101,
            headword: 'achievement',
            partOfSpeech: 'noun',
            phonetic: '/əˈtʃiːv.mənt/',
            meaning: 'thành tích, thành tựu đạt được',
            exampleSentence: 'Winning the scholarship was a remarkable achievement.',
            audioUrl: '/audio/achievement.mp3',
            imageUrl: 'https://placehold.co/200x200/png?text=Achievement',
            isBookmarked: false,
          },
          {
            id: 102,
            headword: 'butterfly',
            partOfSpeech: 'noun',
            phonetic: '/ˈbʌt.ə.flaɪ/',
            meaning: 'con bướm',
            exampleSentence: 'A colorful butterfly landed on the flower.',
            audioUrl: '/audio/butterfly.mp3',
            imageUrl: 'https://placehold.co/200x200/png?text=Butterfly',
            isBookmarked: false,
          },
        ],
      },
      {
        id: 11,
        courseId: 1,
        title: 'Bài 2: Daily Routines',
        description: 'Mô tả thói quen sinh hoạt mỗi ngày',
        content: 'Thì Hiện tại đơn với các trạng từ chỉ tần suất.',
        videoUrl: '',
        cefrLevel: 'A1',
        isLocked: true,
        isCompleted: false,
        words: [],
      },
    ],
    tests: [
      {
        id: 1,
        lessonId: 10,
        title: 'Bài kiểm tra Bài 1: Greeting & Vocabulary',
        description: 'Đánh giá từ vựng và ngữ pháp đã học trong bài 1',
        cefrLevel: 'A1',
        timeLimitMin: 15,
        passingScore: 80,
        type: 'lesson_practice',
        questions: [
          {
            id: 201,
            questionText: 'What is the synonym of "achievement"?',
            questionType: 'multiple_choice',
            skill: 'Vocabulary',
            eloRating: 1200,
            answers: [
              { id: 1, text: 'Failure', isCorrect: false },
              { id: 2, text: 'Accomplishment', isCorrect: true },
              { id: 3, text: 'Problem', isCorrect: false },
              { id: 4, text: 'Delay', isCorrect: false },
            ],
            explanation: '"Accomplishment" đồng nghĩa với "Achievement" (thành tựu, thành tích).',
          },
          {
            id: 202,
            questionText: 'Điền từ thích hợp: He is working towards a _______ future.',
            questionType: 'fill_in_blank',
            skill: 'Grammar',
            eloRating: 1250,
            answers: [{ id: 5, text: 'sustainable', isCorrect: true }],
            explanation: 'Tính từ "sustainable" (bền vững) bổ nghĩa cho danh từ "future".',
          },
          {
            id: 203,
            questionText: 'Lắng nghe đoạn hội thoại và chọn đáp án chính xác',
            questionType: 'listening',
            skill: 'Listening',
            eloRating: 1150,
            audioUrl: '/audio/q203_dialog.mp3',
            answers: [
              { id: 6, text: 'At the airport', isCorrect: true },
              { id: 7, text: 'In a restaurant', isCorrect: false },
            ],
            explanation: 'Nhân vật đề cập đến chuyến bay và cổng soát vé.',
          },
          {
            id: 204,
            questionText: 'Đọc to câu sau: Artificial intelligence is transforming our daily life.',
            questionType: 'speaking',
            skill: 'Vocabulary',
            eloRating: 1280,
            answers: [{ id: 8, text: 'Artificial intelligence is transforming our daily life.', isCorrect: true }],
            explanation: 'Phát âm rõ ràng các âm vị /ˌɑː.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns/.',
          },
          {
            id: 205,
            questionText: 'Viết một đoạn văn ngắn 3-5 câu kể về sở thích của bạn.',
            questionType: 'writing',
            skill: 'Grammar',
            eloRating: 1220,
            answers: [],
            explanation: 'Đảm bảo chia đúng thì Hiện tại đơn và dùng từ nối.',
          },
        ],
      },
    ],
    games: {
      bubble: { code: 'BUBBLE', maxScore: 320, playedCount: 5 },
      memory: { code: 'MEMORY', maxScore: 240, playedCount: 3 },
      matching: { code: 'MATCHING', maxScore: 300, playedCount: 4 },
      mario: { code: 'MARIO', maxScore: 260, playedCount: 2 },
    },
    communityPosts: [
      {
        id: 1,
        userId: 1,
        authorName: 'hocvien_chuan',
        authorAvatar: 'https://ui-avatars.com/api/?name=Hoc+Vien',
        content: 'Hôm nay mình đã hoàn thành chuỗi 7 ngày học liên tiếp trên EngMaster! Cố lên nào mọi người!',
        isPublic: true,
        createdAt: '10 phút trước',
        likesCount: 5,
        isLiked: false,
        comments: [
          {
            id: 1,
            userId: 2,
            authorName: 'nguyen_van_a',
            authorAvatar: 'https://ui-avatars.com/api/?name=Nguyen+A',
            content: 'Chúc mừng bạn nhé, cùng cố gắng!',
            createdAt: '5 phút trước',
          },
        ],
      },
      {
        id: 2,
        userId: 1,
        authorName: 'hocvien_chuan',
        authorAvatar: 'https://ui-avatars.com/api/?name=Hoc+Vien',
        content: 'Ghi chú học tập riêng tư: Ôn kỹ các cấu trúc đảo ngữ.',
        isPublic: false,
        createdAt: '1 giờ trước',
        likesCount: 0,
        isLiked: false,
        comments: [],
      },
    ],
    savedWords: [
      {
        id: 1,
        wordId: 101,
        headword: 'achievement',
        phonetic: '/əˈtʃiːv.mənt/',
        partOfSpeech: 'noun',
        meaning: 'thành tích, thành tựu đạt được',
        cefrLevel: 'B1',
        audioUrl: '/audio/achievement.mp3',
        memoryLevel: 2,
        nextReviewDate: 'Hôm nay',
        isDueToday: true,
      },
    ],
    quests: [
      { id: 1, title: 'Đăng nhập ứng dụng', targetCount: 1, currentCount: 1, rewardXp: 20, isClaimed: false },
      { id: 2, title: 'Học 5 từ vựng mới', targetCount: 5, currentCount: 3, rewardXp: 30, isClaimed: false },
      { id: 3, title: 'Hoàn thành 1 bài kiểm tra', targetCount: 1, currentCount: 0, rewardXp: 50, isClaimed: false },
    ],
    notifications: [
      { id: 1, title: 'Nhắc nhở học tập', body: 'Đã đến giờ ôn tập từ vựng hôm nay!', isRead: false, createdAt: '20:00' },
      { id: 2, title: 'Chúc mừng thăng hạng', body: 'Bạn đã đạt mốc 400 XP và leo lên vị trí mới!', isRead: false, createdAt: 'Hôm qua' },
    ],
    achievements: [
      { id: 1, title: 'Người mới bắt đầu', description: 'Hoàn thành bài học đầu tiên', iconUrl: '/badges/badge1.png', isUnlocked: true, unlockedAt: '2026-10-20', progress: 1, target: 1, rewardXp: 50 },
      { id: 2, title: 'Chiến thần 7 ngày', description: 'Duy trì chuỗi học 7 ngày liên tục', iconUrl: '/badges/badge_streak_7.png', isUnlocked: false, progress: 5, target: 7, rewardXp: 100 },
      { id: 3, title: 'Kho từ vựng 100', description: 'Lưu và ghi nhớ 100 từ vựng', iconUrl: '/badges/badge_words_100.png', isUnlocked: false, progress: 65, target: 100, rewardXp: 150 },
    ],
    aiChatSessions: [
      {
        id: 1,
        title: 'Hỏi về cấu trúc Although / In spite of',
        lastMessage: 'Although đi với mệnh đề, in spite of đi với danh từ/cụm danh từ.',
        updatedAt: 'Hôm qua',
        messages: [
          { id: 1, sender: 'user', text: 'Phân biệt cách dùng Although và In spite of', createdAt: '10:00' },
          { id: 2, sender: 'ai', text: 'Chào bạn! Điểm khác biệt mấu chốt:\n- Although + S + V (mệnh đề)\n- In spite of + Noun / V-ing', createdAt: '10:01' },
        ],
      },
    ],
    loginAttempts: {},
    requests: [],
  };
}

