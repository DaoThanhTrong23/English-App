import fs from "fs";
import path from "path";

export interface TopicLevelSettings {
  defaultLimit: number;
  groups: {
    'A1-A2': number;
    'B1-B2': number;
    'C1-C2': number;
  };
}

const DEFAULT_SETTINGS: TopicLevelSettings = {
  defaultLimit: 7,
  groups: {
    'A1-A2': 5,
    'B1-B2': 7,
    'C1-C2': 10,
  },
};

export class TopicSettingService {
  private configFilePath: string;
  private settings: TopicLevelSettings = DEFAULT_SETTINGS;

  constructor() {
    this.configFilePath = path.join(process.cwd(), "data", "topic-settings.json");
    this.init();
  }

  private init(): void {
    const dataDir = path.dirname(this.configFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.configFilePath)) {
      this.saveToFile(DEFAULT_SETTINGS);
    } else {
      try {
        const raw = fs.readFileSync(this.configFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        
        // Hỗ trợ cả định dạng cũ (levels) nếu có
        const oldLevels = parsed.levels || {};
        const groups = {
          'A1-A2': Number(parsed.groups?.['A1-A2']) || Number(oldLevels.A1) || DEFAULT_SETTINGS.groups['A1-A2'],
          'B1-B2': Number(parsed.groups?.['B1-B2']) || Number(oldLevels.B1) || DEFAULT_SETTINGS.groups['B1-B2'],
          'C1-C2': Number(parsed.groups?.['C1-C2']) || Number(oldLevels.C1) || DEFAULT_SETTINGS.groups['C1-C2'],
        };

        this.settings = {
          defaultLimit: Number(parsed.defaultLimit) || DEFAULT_SETTINGS.defaultLimit,
          groups,
        };
      } catch (err) {
        console.error("Lỗi khi đọc file topic-settings.json, sử dụng mặc định:", err);
        this.settings = DEFAULT_SETTINGS;
      }
    }
  }

  private saveToFile(data: TopicLevelSettings): void {
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(data, null, 2), "utf-8");
      this.settings = data;
    } catch (err) {
      console.error("Lỗi khi lưu file topic-settings.json:", err);
    }
  }

  public getSettings(): TopicLevelSettings {
    this.init();
    return this.settings;
  }

  public updateSettings(partial: { defaultLimit?: number; groups?: Record<string, number> }): TopicLevelSettings {
    const updated: TopicLevelSettings = {
      defaultLimit: partial.defaultLimit !== undefined ? Math.max(1, Number(partial.defaultLimit)) : this.settings.defaultLimit,
      groups: {
        'A1-A2': Math.max(1, Number(partial.groups?.['A1-A2']) || this.settings.groups['A1-A2']),
        'B1-B2': Math.max(1, Number(partial.groups?.['B1-B2']) || this.settings.groups['B1-B2']),
        'C1-C2': Math.max(1, Number(partial.groups?.['C1-C2']) || this.settings.groups['C1-C2']),
      },
    };

    this.saveToFile(updated);
    return updated;
  }

  /**
   * Lấy số lượng topic hiển thị cho một cấp độ (Dễ: A1-A2, Trung bình: B1-B2, Khó: C1-C2)
   */
  public getLimitForLevel(cefrLevel?: string | null): number {
    this.init();
    if (!cefrLevel) return this.settings.defaultLimit;
    const cleanLevel = cefrLevel.trim().toUpperCase();

    // 1. Phân loại theo 3 nhóm cấp độ chuẩn
    if (cleanLevel.includes('A')) {
      return this.settings.groups['A1-A2'] || 5;
    }
    if (cleanLevel.includes('B')) {
      return this.settings.groups['B1-B2'] || 7;
    }
    if (cleanLevel.includes('C')) {
      return this.settings.groups['C1-C2'] || 10;
    }

    return this.settings.defaultLimit;
  }
}

export const topicSettingService = new TopicSettingService();
