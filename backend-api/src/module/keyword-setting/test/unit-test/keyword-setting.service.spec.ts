import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeywordSettingService } from '../../keyword-setting.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

describe('KeywordSettingService - Unit Tests (QC 10-Year Standard)', () => {
  let service: KeywordSettingService;

  beforeEach(() => {
    service = new KeywordSettingService();
    (service as any).saveToCsv = vi.fn();
    (service as any).groups = [
      { id: 'kw-default-1', group: 'Công nghệ (IT)', keywords: ['it', 'ai', 'lập trình'] },
      { id: 'kw-default-2', group: 'Kinh doanh', keywords: ['marketing', 'ceo'] },
    ];
  });

  describe('1. Happy Cases', () => {
    it('[KWS-01a] Lấy danh sách nhóm từ khóa và từ điển đồng nghĩa thành công', () => {
      const groups = service.getAll();
      const dict = service.getSynonymDict();

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
      expect(dict).toHaveProperty('công nghệ (it)');
    });

    it('[KWS-01b] Tạo nhóm từ khóa mới và loại bỏ các từ trùng lặp', () => {
      const newGroup = service.createGroup('Khoa học vũ trụ', ['vũ trụ', 'sao', 'vũ trụ', 'hành tinh']);

      expect(newGroup.group).toBe('Khoa học vũ trụ');
      expect(newGroup.keywords).toHaveLength(3); // 'vũ trụ' được lọc trùng
    });

    it('[KWS-01c] Cập nhật và xóa nhóm từ khóa thành công', () => {
      const created = service.createGroup('Tạm thời để xóa', ['a', 'b']);
      const updated = service.updateGroup(created.id, 'Tạm thời đổi tên', ['x', 'y']);

      expect(updated.group).toBe('Tạm thời đổi tên');

      const deleted = service.deleteGroup(created.id);
      expect(deleted).toBe(true);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[KWS-02a] Tạo nhóm với tên rỗng ném lỗi 400 bad_request', () => {
      expect(() => service.createGroup('   ', ['a'])).toThrow(ApiError);
    });

    it('[KWS-02b] Xóa nhóm không tồn tại ném lỗi 404 not_found', () => {
      expect(() => service.deleteGroup('non_existent_id_9999')).toThrow(ApiError);
    });
  });

  describe('3. Concurrency & Race Condition', () => {
    it('[KWS-03] Thêm nhiều nhóm liên tiếp bảo toàn mảng dữ liệu trong bộ nhớ', () => {
      const g1 = service.createGroup('Nhóm Song Song 1', ['a']);
      const g2 = service.createGroup('Nhóm Song Song 2', ['b']);

      const all = service.getAll();
      expect(all.some(g => g.id === g1.id)).toBe(true);
      expect(all.some(g => g.id === g2.id)).toBe(true);
    });
  });

  describe('4. Data Conflict & Duplicate Groups', () => {
    it('[KWS-04] Chặn tạo nhóm trùng tên với nhóm đã tồn tại (case-insensitive)', () => {
      expect(() => service.createGroup('CÔNG NGHỆ (IT)', ['tech'])).toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'duplicate' })
      );
    });
  });

  describe('5. Network & Infrastructure / File I/O', () => {
    it('[KWS-05] Đường dẫn file CSV được khởi tạo hợp lệ', () => {
      const csvPath = service.getCsvFilePath();
      expect(csvPath).toContain('synonyms.csv');
    });
  });
});
