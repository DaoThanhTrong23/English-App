import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../../ai.service.js';
import { mockEssayEvaluation, mockChatResponse } from '../data-mock/ai.mock.js';
import ollama from 'ollama';
import { prisma } from '../../../../config/prisma.js';

vi.mock('ollama', () => ({
  default: {
    chat: vi.fn(),
  },
}));

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockImplementation(async () => ({ text: 'apple' }))
  ),
  env: { allowLocalModels: false },
}));

const mockGetSamples = vi.fn().mockReturnValue(new Float32Array(3200));

vi.mock('wavefile', () => {
  class MockWaveFile {
    toSampleRate = vi.fn();
    toBitDepth = vi.fn();
    getSamples = mockGetSamples;
  }
  return {
    default: {
      WaveFile: MockWaveFile,
    },
    WaveFile: MockWaveFile,
  };
});

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    aiChatSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    aiChatMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    word: {
      findFirst: vi.fn(),
    },
  },
}));

describe('AIService - Unit Tests (QC 10-Year Standard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Happy Cases', () => {
    it('[AI-01a] Chấm điểm bài viết (gradeEssay) thành công', async () => {
      (ollama.chat as any).mockResolvedValue({
        message: { content: JSON.stringify(mockEssayEvaluation) },
      });

      const res = await aiService.gradeEssay({
        text: 'This is my English essay about technology and education.',
        topic: 'Technology',
      });

      expect(res.overallScore).toBe(7.5);
      expect(res.cefrLevel).toBe('B2');
      expect(res.strengths).toHaveLength(2);
      expect(ollama.chat).toHaveBeenCalled();
    });

    it('[AI-01b] Chat với AI Bot tạo session mới thành công', async () => {
      (prisma.aiChatSession.create as any).mockResolvedValue({ id: 123, userId: 1 });
      (prisma.aiChatMessage.findMany as any).mockResolvedValue([]);
      (ollama.chat as any).mockResolvedValue({
        message: { content: 'Hello! How can I help you practice English today?' },
      });
      (prisma.aiChatMessage.create as any).mockResolvedValue({ id: 1 });

      const res = await aiService.chatWithBot(1, 'Hi, I want to learn English');

      expect(res.sessionId).toBe(123);
      expect(res.response).toContain('Hello!');
      expect(prisma.aiChatSession.create).toHaveBeenCalled();
    });

    it('[AI-GOP-01] evaluatePronunciationGOP với targetIpa rõ ràng', async () => {
      const mockAudio = Buffer.alloc(6400);
      const res = await aiService.evaluatePronunciationGOP(mockAudio, 'apple', '/ˈæp.əl/');

      expect(res.targetWord).toBe('apple');
      expect(res.targetIpa).toBe('/ˈæp.əl/');
      expect(res.overallScore).toBeGreaterThan(0);
      expect(res.phonemeScores.length).toBeGreaterThan(0);
    });

    it('[AI-GOP-02] evaluatePronunciationGOP tự động phân giải IPA từ COMMON_IPA_DICT khi targetIpa để trống', async () => {
      const mockAudio = Buffer.alloc(6400);
      const res = await aiService.evaluatePronunciationGOP(mockAudio, 'apple');

      expect(res.targetWord).toBe('apple');
      expect(res.targetIpa).toBe('/ˈæp.əl/');
      expect(res.overallScore).toBeGreaterThan(0);
    });

    it('[AI-GOP-03] evaluatePronunciationGOP tự động tra cứu IPA từ DB Word khi không có trong dict', async () => {
      vi.mocked(prisma.word.findFirst).mockResolvedValue({
        id: 10,
        headword: 'cucumber',
        phonetic: '/ˈkjuː.kʌm.bər/',
      } as any);

      const mockAudio = Buffer.alloc(6400);
      const res = await aiService.evaluatePronunciationGOP(mockAudio, 'cucumber');

      expect(res.targetWord).toBe('cucumber');
      expect(res.targetIpa).toBe('/ˈkjuː.kʌm.bər/');
      expect(prisma.word.findFirst).toHaveBeenCalledWith({
        where: { headword: 'cucumber' },
        select: { phonetic: true },
      });
    });

    it('[AI-GOP-04] evaluatePronunciationGOP tự sinh IPA qua Rule-based G2P khi từ không có trong DB', async () => {
      vi.mocked(prisma.word.findFirst).mockResolvedValue(null);

      const mockAudio = Buffer.alloc(6400);
      const res = await aiService.evaluatePronunciationGOP(mockAudio, 'unprecedentedxyz');

      expect(res.targetWord).toBe('unprecedentedxyz');
      expect(res.targetIpa).toBeDefined();
      expect(res.phonemeScores.length).toBeGreaterThan(0);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[AI-02a] Ollama trả về JSON không đúng format ném lỗi cú pháp', async () => {
      (ollama.chat as any).mockResolvedValue({
        message: { content: 'Invalid JSON string from model' },
      });

      await expect(
        aiService.gradeEssay({ text: 'Some sample English paragraph.' })
      ).rejects.toThrow();
    });

    it('[AI-02b] Lỗi khi lưu tin nhắn chat với session không hợp lệ ném lỗi', async () => {
      (prisma.aiChatMessage.create as any).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      await expect(
        aiService.chatWithBot(1, 'Hello', 999)
      ).rejects.toThrow();
    });

    it('[AI-GOP-05] evaluatePronunciationGOP khi âm thanh im lặng (< 1600 samples) trả về score 0', async () => {
      mockGetSamples.mockReturnValueOnce(new Float32Array(500)); // < 1600 mẫu

      const res = await aiService.evaluatePronunciationGOP(Buffer.alloc(100), 'apple');

      expect(res.overallScore).toBe(0);
      expect(res.spokenText).toBe('(Không có âm thanh)');
      expect(res.explanation).toContain('Không phát hiện âm thanh');
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[AI-03] Hai bài viết gửi chấm song song', async () => {
      (ollama.chat as any).mockResolvedValue({
        message: { content: JSON.stringify(mockEssayEvaluation) },
      });

      const [res1, res2] = await Promise.all([
        aiService.gradeEssay({ text: 'First essay' }),
        aiService.gradeEssay({ text: 'Second essay' }),
      ]);

      expect(res1.overallScore).toBe(7.5);
      expect(res2.overallScore).toBe(7.5);
      expect(ollama.chat).toHaveBeenCalledTimes(2);
    });

    it('[AI-05] Mất kết nối Ollama service (ECONNREFUSED) ném lỗi hệ thống', async () => {
      (ollama.chat as any).mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

      await expect(
        aiService.gradeEssay({ text: 'Another essay sample' })
      ).rejects.toThrow('ECONNREFUSED');
    });

    it('[AI-GOP-CON-01] 2 request chấm phát âm GOP song song không xung đột bộ nhớ', async () => {
      const mockAudio = Buffer.alloc(6400);
      const [r1, r2] = await Promise.all([
        aiService.evaluatePronunciationGOP(mockAudio, 'apple'),
        aiService.evaluatePronunciationGOP(mockAudio, 'banana'),
      ]);

      expect(r1.targetWord).toBe('apple');
      expect(r2.targetWord).toBe('banana');
    });

    it('[AI-GOP-NET-01] Lỗi DB khi tra cứu IPA tự động fallback sang G2P rule', async () => {
      vi.mocked(prisma.word.findFirst).mockRejectedValue(new Error('DB connection timed out'));

      const mockAudio = Buffer.alloc(6400);
      const res = await aiService.evaluatePronunciationGOP(mockAudio, 'uniqueword');

      expect(res.targetWord).toBe('uniqueword');
      expect(res.overallScore).toBeGreaterThan(0);
    });
  });
});
