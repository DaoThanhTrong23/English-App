// Phản chiếu lại Schema của Backend để FE có nhắc code
export interface StudentParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'lastLoginDate' | 'xpPoints' | 'username';
  sortOrder?: 'asc' | 'desc';
}

export interface Student {
  id: number;
  username: string;
  email: string;
  xpPoints: number;
  lastLoginDate: string | null;
  createdAt: string;
}

export interface StudentResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
