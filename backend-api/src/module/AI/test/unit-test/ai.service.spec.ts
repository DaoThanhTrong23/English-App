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
  });
});
