import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameService } from '../../game.service.js';
import { mockGameItem, mockGameWord, mockGameHistory } from '../data-mock/game.mock.js';
import { prisma } from '../../../../config/prisma.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';
import { GameSettingSchema, UpdateGameSettingsSchema } from '../../game.schema.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    game: {
      findUnique: vi.fn(),
    },
    gameHistory: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('GameService - Unit Tests (QC 10-Year Standard)', () => {
  let service: GameService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findAll: vi.fn(),
      findByCode: vi.fn(),
      updateSettings: vi.fn(),
    };
    service = new GameService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[GAME-01a] Lấy danh sách game hỗ trợ thành công', async () => {
      mockRepo.findAll.mockResolvedValue([mockGameItem]);

      const res = await service.getAllGames();

      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('bubble_burst');
    });

    it('[GAME-01b] Cập nhật settings cho game', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(mockGameItem);
      mockRepo.updateSettings.mockResolvedValue([
        { id: 1, gameId: 1, difficulty: 'EASY', itemCount: 8, pointsPerItem: 15, timeLimit: null, createdAt: new Date(), updatedAt: new Date() }
      ] as any);

      const res = await service.updateSettings(1, {
        settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any,
      });

      expect(res[0].itemCount).toBe(8);
      expect(mockRepo.updateSettings).toHaveBeenCalled();
    });

    it('[GAME-01c] Lấy lịch sử và thống kê game của user', async () => {
      (prisma.gameHistory.findMany as any).mockResolvedValue([mockGameHistory]);
      (prisma.gameHistory.groupBy as any).mockResolvedValue([
        { gameCode: 'bubble_burst', _max: { score: 100 }, _count: { id: 1 } },
      ]);

      const res = await service.getHistory(1);

      expect(res.history).toHaveLength(1);
      expect(res.stats).toHaveLength(1);
    });

    it('[GAME-01d] Chuẩn bị bàn chơi game (play)', async () => {
      mockRepo.findByCode.mockResolvedValue(mockGameItem);
      (prisma.$queryRaw as any).mockResolvedValue([mockGameWord]);

      const res = await service.play('bubble_burst', 'EASY', 'A1');

      expect(res.game.code).toBe('bubble_burst');
      expect(res.setting.difficulty).toBe('EASY');
      expect(res.words).toHaveLength(1);
    });
  });

  describe('2. Activity Logging Tests', () => {
    it('[GAME-LOG-01] Ghi activity log thành công khi user bắt đầu chơi game (USER_PLAY_GAME_SUCCESS)', async () => {
      mockRepo.findByCode.mockResolvedValue(mockGameItem);
      (prisma.$queryRaw as any).mockResolvedValue([mockGameWord]);

      await service.play('bubble_burst', 'EASY', 'A1');
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'USER_PLAY_GAME_SUCCESS',
        })
      );
    });

    it('[GAME-LOG-02] Ghi activity log thất bại khi chơi game không tồn tại (USER_PLAY_GAME_FAILED)', async () => {
      mockRepo.findByCode.mockResolvedValue(null);

      await expect(service.play('invalid_code', 'EASY', 'A1')).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'USER_PLAY_GAME_FAILED',
        })
      );
    });

    it('[GAME-LOG-03] Ghi activity log thành công khi admin cập nhật cấu hình (ADMIN_UPDATE_GAME_SETTINGS_SUCCESS)', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(mockGameItem);
      mockRepo.updateSettings.mockResolvedValue([
        { id: 1, gameId: 1, difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }
      ]);

      await service.updateSettings(1, {
        settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any,
      });
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'ADMIN_UPDATE_GAME_SETTINGS_SUCCESS',
        })
      );
    });

    it('[GAME-LOG-04] Ghi activity log thất bại khi admin cập nhật game không tồn tại (ADMIN_UPDATE_GAME_SETTINGS_FAILED)', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(null);

      await expect(
        service.updateSettings(999, {
          settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any,
        })
      ).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'ADMIN_UPDATE_GAME_SETTINGS_FAILED',
        })
      );
    });
  });

  describe('3. Concurrency & Conflict Tests', () => {
    it('[GAME-CONF-01] Hai admin đồng thời cập nhật cấu hình của cùng 1 game (concurrency)', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(mockGameItem);
      mockRepo.updateSettings
        .mockResolvedValueOnce([{ id: 1, difficulty: 'EASY', itemCount: 6 }])
        .mockResolvedValueOnce([{ id: 1, difficulty: 'EASY', itemCount: 8 }]);

      const [res1, res2] = await Promise.all([
        service.updateSettings(1, { settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] as any }),
        service.updateSettings(1, { settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any }),
      ]);

      expect(res1[0].itemCount).toBe(6);
      expect(res2[0].itemCount).toBe(8);
      expect(mockRepo.updateSettings).toHaveBeenCalledTimes(2);
    });

    it('[GAME-CONF-02] Client request play game đồng thời khi admin đang cập nhật cấu hình', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(mockGameItem);
      mockRepo.findByCode.mockResolvedValue(mockGameItem);
      (prisma.$queryRaw as any).mockResolvedValue([mockGameWord]);
      mockRepo.updateSettings.mockResolvedValue([{ id: 1, difficulty: 'EASY', itemCount: 8 }]);

      const [playRes, updateRes] = await Promise.all([
        service.play('bubble_burst', 'EASY', 'A1'),
        service.updateSettings(1, { settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any }),
      ]);

      expect(playRes.game.code).toBe('bubble_burst');
      expect(updateRes[0].itemCount).toBe(8);
    });
  });

  describe('4. Bad End & Schema Validation Cases', () => {
    it('[GAME-02a] Cập nhật settings cho game không tồn tại ném lỗi 404', async () => {
      (prisma.game.findUnique as any).mockResolvedValue(null);

      await expect(
        service.updateSettings(999, {
          settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] as any,
        })
      ).rejects.toThrowError(expect.objectContaining({ statuscode: 404, code: 'not_found' }));
    });

    it('[GAME-02b] Play game không tồn tại code ném 404', async () => {
      mockRepo.findByCode.mockResolvedValue(null);

      await expect(service.play('invalid_code', 'EASY', 'A1')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });

    it('[GAME-02c] Play game với độ khó chưa cấu hình ném 404', async () => {
      mockRepo.findByCode.mockResolvedValue(mockGameItem);

      await expect(service.play('bubble_burst', 'EXTREME', 'A1')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });

    it('[GAME-VAL-01] Validation: Chặn GameSettingSchema khi difficulty không thuộc EASY/NORMAL/HARD', () => {
      const parsed = GameSettingSchema.safeParse({
        difficulty: 'SUPER_HARD',
        itemCount: 6,
        pointsPerItem: 10,
      });
      expect(parsed.success).toBe(false);
    });

    it('[GAME-VAL-02] Validation: Chặn GameSettingSchema khi itemCount <= 0 hoặc pointsPerItem < 0', () => {
      const parsed1 = GameSettingSchema.safeParse({
        difficulty: 'EASY',
        itemCount: 0,
        pointsPerItem: 10,
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = GameSettingSchema.safeParse({
        difficulty: 'EASY',
        itemCount: 6,
        pointsPerItem: -5,
      });
      expect(parsed2.success).toBe(false);
    });

    it('[GAME-VAL-03] Validation: Chặn UpdateGameSettingsSchema khi settings rỗng hoặc params id <= 0', () => {
      const parsed1 = UpdateGameSettingsSchema.safeParse({
        params: { id: 1 },
        body: { settings: [] },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = UpdateGameSettingsSchema.safeParse({
        params: { id: 0 },
        body: { settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] },
      });
      expect(parsed2.success).toBe(false);
    });

    it('[GAME-05] Mất kết nối database khi truy vấn từ vựng ném lỗi', async () => {
      mockRepo.findByCode.mockResolvedValue(mockGameItem);
      (prisma.$queryRaw as any).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.play('bubble_burst', 'EASY', 'A1')).rejects.toThrow('Connection lost');
    });
  });
});
