export interface StudentParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'lastLoginDate' | 'xpPoints' | 'username';
  sortOrder?: 'asc' | 'desc';
}

export interface StudentProgress {
  totalWordsTracked: number;
  masteredWords: number;
  learningWords: number;
  completedTestCount: number;
  achivievementsCount: number;
}

export interface Student {
  id: number;
  username: string;
  email: string;
  xpPoints: number;
  lastLoginDate: string | null;
  lastActiveAt: string | null;
  lastestActivity: string | null;
  joinedAt: string;
  progress: StudentProgress;
}

export interface StudentResponse {
  success: boolean;
  message: string;
  data: {
    items: Student[];
    pagination: {
      totalItems: number;
      currentPage: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }
}

export interface StudentDetailResponse {
  success: boolean;
  message: string;
  data: {
    profile: {
      id: number;
      username: string;
      email: string;
      xpPoints: number;
      lastLoginDate: string | null;
      joinedAt: string;
    };
    progressSummary: {
      totalWords: number;
      masteredWords: number;
      learningWords: number;
      testsCompleted: number;
      averageTestScore: number;
      achievementsUnlocked: number;
    };
    recentTests: any[];
    recentActivities: any[];
    achievements: any[];
  }
}
