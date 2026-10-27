import fs from "fs";
import path from "path";
import { ApiError } from "../../shared/http/api-error.js";

export interface KeywordGroup {
  id: string;
  group: string;
  keywords: string[];
}

const DEFAULT_SYNONYMS: Record<string, string[]> = {
  'công nghệ (it)': ['it', 'công nghệ', 'lập trình', 'phần mềm', 'developer', 'máy tính', 'công nghệ thông tin', 'coding', 'coder', 'frontend', 'backend', 'ai', 'trí tuệ nhân tạo', 'data', 'dữ liệu', 'web', 'app', 'mobile', 'ứng dụng', 'mạng', 'network', 'cyber', 'bảo mật', 'database'],
  'du lịch': ['du lịch', 'travel', 'khách sạn', 'nhà hàng', 'sân bay', 'tourism', 'tourist', 'đặt phòng', 'hotel', 'resort', 'vé máy bay', 'chuyến bay', 'flight', 'nghỉ dưỡng', 'hướng dẫn viên', 'tour', 'passport', 'visa', 'hành lý', 'hộ chiếu'],
  'kinh doanh': ['kinh doanh', 'business', 'công sở', 'doanh nghiệp', 'tài chính', 'bán hàng', 'sales', 'marketing', 'văn phòng', 'startup', 'khởi nghiệp', 'đầu tư', 'kinh tế', 'thương mại', 'office', 'boss', 'quản lý', 'sếp', 'ceo', 'kế toán', 'accounting', 'hợp đồng', 'thương lượng'],
  'giải trí / game': ['giải trí', 'game', 'trò chơi', 'phim', 'âm nhạc', 'music', 'movie', 'thể thao', 'sport', 'bóng đá', 'ca nhạc', 'ca sĩ', 'diễn viên', 'hollywood', 'esports', 'streaming', 'youtube', 'tiktok', 'vlog', 'nghệ sĩ', 'idol', 'giải vô địch', 'cinema'],
  'văn hóa nghệ thuật': ['văn hóa', 'nghệ thuật', 'art', 'culture', 'lịch sử', 'bảo tàng', 'hội họa', 'kiến trúc', 'văn học', 'thơ ca', 'phong tục', 'truyền thống', 'di sản', 'gallery', 'exhibition', 'triển lãm', 'điêu khắc', 'tôn giáo', 'tín ngưỡng'],
  'giao tiếp hằng ngày': ['giao tiếp', 'hằng ngày', 'hàng ngày', 'cuộc sống', 'đời sống', 'daily', 'communication', 'chào hỏi', 'sinh hoạt', 'bạn bè', 'gia đình', 'mua sắm', 'shopping', 'thời tiết', 'weather', 'hỏi đường', 'ăn uống', 'food', 'restaurant', 'sức khỏe', 'bác sĩ'],
  'kỹ năng mềm': ['kỹ năng', 'mềm', 'thuyết trình', 'lãnh đạo', 'đàm phán', 'soft skills', 'làm việc nhóm', 'teamwork', 'quản lý thời gian', 'time management', 'giải quyết vấn đề', 'giao tiếp hiệu quả', 'tự học', 'tư duy', 'mindset', 'phỏng vấn', 'interview'],
  'học thuật': ['học thuật', 'academic', 'ielts', 'toefl', 'toeic', 'nghiên cứu', 'khoa học', 'trường học', 'giáo dục', 'đại học', 'university', 'college', 'sinh viên', 'student', 'thi cử', 'exam', 'test', 'luận văn', 'thesis', 'essay', 'ngữ pháp', 'từ vựng chuẩn', 'giáo sư']
};

export class KeywordSettingService {
  private csvFilePath: string;
  private groups: KeywordGroup[] = [];

  constructor() {
    this.csvFilePath = path.join(process.cwd(), "data", "synonyms.csv");
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    const dataDir = path.dirname(this.csvFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.csvFilePath)) {
      this.writeDefaultCsv();
    } else {
      this.loadFromCsv();
    }
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private escapeCsv(val: string): string {
    return `"${val.replace(/"/g, '""')}"`;
  }

  public loadFromCsv(): KeywordGroup[] {
    try {
      if (!fs.existsSync(this.csvFilePath)) {
        this.writeDefaultCsv();
        return this.groups;
      }

      let content = fs.readFileSync(this.csvFilePath, 'utf8');
      // Bỏ BOM nếu có
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }

      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const parsedGroups: KeywordGroup[] = [];

      // Bỏ qua dòng header (group,keywords)
      const dataLines = lines.length > 0 && lines[0].toLowerCase().includes('group') ? lines.slice(1) : lines;

      for (let index = 0; index < dataLines.length; index++) {
        const line = dataLines[index];
        const cols = this.parseCsvLine(line);
        if (cols.length >= 2) {
          const groupName = cols[0].replace(/^["']|["']$/g, '').trim();
          const rawKeywords = cols[1].replace(/^["']|["']$/g, '').trim();
          const keywords = rawKeywords
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);

          if (groupName) {
            parsedGroups.push({
              id: `kw-group-${index + 1}`,
              group: groupName,
              keywords
            });
          }
        }
      }

      this.groups = parsedGroups;
      return this.groups;
    } catch (error) {
      console.error("Error reading synonyms.csv:", error);
      return this.groups;
    }
  }

  private saveToCsv(): void {
    const rows: string[] = ['group,keywords'];
    for (const item of this.groups) {
      const kwStr = item.keywords.join(', ');
      rows.push(`${this.escapeCsv(item.group)},${this.escapeCsv(kwStr)}`);
    }
    // Ghi file với BOM để Excel hiển thị tiếng Việt chuẩn UTF-8
    const content = '\uFEFF' + rows.join('\r\n') + '\r\n';
    fs.writeFileSync(this.csvFilePath, content, 'utf8');
  }

  private writeDefaultCsv(): void {
    this.groups = Object.entries(DEFAULT_SYNONYMS).map(([group, keywords], idx) => ({
      id: `kw-group-${idx + 1}`,
      group,
      keywords
    }));
    this.saveToCsv();
  }

  public getAll(): KeywordGroup[] {
    if (this.groups.length === 0) {
      this.loadFromCsv();
    }
    return this.groups;
  }

  public getSynonymDict(): Record<string, string[]> {
    const groups = this.getAll();
    const dict: Record<string, string[]> = {};
    for (const item of groups) {
      dict[item.group.toLowerCase()] = item.keywords.map(k => k.toLowerCase());
    }
    return dict;
  }

  public resolveExpandedKeywords(interestsOrJobs: string[]): Set<string> {
    const dict = this.getSynonymDict();
    const expanded = new Set<string>();

    for (const raw of interestsOrJobs) {
      const norm = raw.trim().toLowerCase();
      if (!norm) continue;

      expanded.add(norm);

      // 1. Direct match
      if (dict[norm]) {
        dict[norm].forEach(s => expanded.add(s.toLowerCase()));
        continue;
      }

      // 2. Normalize "hàng ngày" vs "hằng ngày"
      const variant1 = norm.replace(/hàng ngày/g, 'hằng ngày');
      if (dict[variant1]) {
        dict[variant1].forEach(s => expanded.add(s.toLowerCase()));
        continue;
      }
      const variant2 = norm.replace(/hằng ngày/g, 'hàng ngày');
      if (dict[variant2]) {
        dict[variant2].forEach(s => expanded.add(s.toLowerCase()));
        continue;
      }

      // 3. Job-specific expansions
      if (norm.includes('sinh viên') || norm.includes('học sinh')) {
        const base = dict['học thuật'] || [];
        base.concat(['sinh viên', 'học sinh', 'trường học', 'lớp học', 'thầy cô', 'bài tập']).forEach(s => expanded.add(s));
        continue;
      }
      if (norm.includes('người đi làm') || norm.includes('đi làm')) {
        const base = dict['kinh doanh'] || [];
        base.concat(['đi làm', 'công sở', 'văn phòng', 'đồng nghiệp', 'công việc', 'doanh nghiệp']).forEach(s => expanded.add(s));
        continue;
      }
      if (norm.includes('giáo viên')) {
        const base = dict['học thuật'] || [];
        base.concat(['giáo viên', 'giảng dạy', 'sư phạm', 'bài giảng']).forEach(s => expanded.add(s));
        continue;
      }

      // 4. Partial substring or keyword inclusion
      for (const [k, v] of Object.entries(dict)) {
        if (k.includes(norm) || norm.includes(k) || v.includes(norm)) {
          v.forEach(s => expanded.add(s.toLowerCase()));
          break;
        }
      }
    }

    return expanded;
  }

  public createGroup(groupName: string, keywords: string[]): KeywordGroup {
    const cleanGroup = groupName.trim();
    if (!cleanGroup) {
      throw new ApiError(400, "bad_request", "Tên nhóm không được để trống");
    }

    const exists = this.groups.some(g => g.group.toLowerCase() === cleanGroup.toLowerCase());
    if (exists) {
      throw new ApiError(400, "duplicate", `Nhóm '${cleanGroup}' đã tồn tại`);
    }

    const cleanKeywords = Array.from(new Set(keywords.map(k => k.trim()).filter(Boolean)));
    const newGroup: KeywordGroup = {
      id: `kw-group-${Date.now()}`,
      group: cleanGroup,
      keywords: cleanKeywords
    };

    this.groups.push(newGroup);
    this.saveToCsv();
    return newGroup;
  }

  public updateGroup(targetIdOrGroup: string, newGroupName: string, keywords: string[]): KeywordGroup {
    const cleanNewGroup = newGroupName.trim();
    if (!cleanNewGroup) {
      throw new ApiError(400, "bad_request", "Tên nhóm không được để trống");
    }

    const index = this.groups.findIndex(
      g => g.id === targetIdOrGroup || g.group.toLowerCase() === targetIdOrGroup.toLowerCase()
    );

    if (index === -1) {
      throw new ApiError(404, "not_found", "Không tìm thấy nhóm từ khóa");
    }

    // Kiểm tra trùng lặp với nhóm khác
    const duplicate = this.groups.some(
      (g, idx) => idx !== index && g.group.toLowerCase() === cleanNewGroup.toLowerCase()
    );
    if (duplicate) {
      throw new ApiError(400, "duplicate", `Nhóm '${cleanNewGroup}' đã tồn tại`);
    }

    const cleanKeywords = Array.from(new Set(keywords.map(k => k.trim()).filter(Boolean)));
    this.groups[index] = {
      ...this.groups[index],
      group: cleanNewGroup,
      keywords: cleanKeywords
    };

    this.saveToCsv();
    return this.groups[index];
  }

  public deleteGroup(targetIdOrGroup: string): boolean {
    const initialLen = this.groups.length;
    this.groups = this.groups.filter(
      g => g.id !== targetIdOrGroup && g.group.toLowerCase() !== targetIdOrGroup.toLowerCase()
    );

    if (this.groups.length === initialLen) {
      throw new ApiError(404, "not_found", "Không tìm thấy nhóm từ khóa cần xóa");
    }

    this.saveToCsv();
    return true;
  }

  public getCsvFilePath(): string {
    return this.csvFilePath;
  }
}

export const keywordSettingService = new KeywordSettingService();
