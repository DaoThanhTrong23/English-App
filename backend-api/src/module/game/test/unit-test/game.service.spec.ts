import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameService } from '../../game.service.js';
import { mockGameItem, mockGameWord, mockGameHistory } from '../data-mock/game.mock.js';
import { prisma } from '../../../../config/prisma.js';

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

  describe('2. Bad End Cases', () => {
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
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[GAME-05] Mất kết nối database khi truy vấn từ vựng ném lỗi', async () => {
      mockRepo.findByCode.mockResolvedValue(mockGameItem);
      (prisma.$queryRaw as any).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.play('bubble_burst', 'EASY', 'A1')).rejects.toThrow('Connection lost');
    });
  });
});
