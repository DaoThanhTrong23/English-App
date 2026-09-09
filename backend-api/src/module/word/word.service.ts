import { wordRepository } from './word.repository.js';
import { CreateWordInput, UpdateWordInput } from './word.schema.js';

export const wordService = {
  async fetchWords(page: number, limit: number, cefrLevel?: string, search?: string) {
    const result = await wordRepository.getWords(page, limit, cefrLevel, search);
    return {
      data: result.words,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total
      }
    };
  },

  async createWord(data: CreateWordInput) {
    return await wordRepository.createWord(data);
  },

  async updateWord(id: string, data: UpdateWordInput) {
    return await wordRepository.updateWord(id, data);
  },

  async deleteWord(id: string) {
    return await wordRepository.deleteWord(id);
  }
};