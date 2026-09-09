import { wordRepository } from './word.repository.js';

export const wordService = {
  async fetchWords(page: number, limit: number, cefrLevel?: string) {
    const result = await wordRepository.getWords(page, limit, cefrLevel);
    
    return {
      data: result.words,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total
      }
    };
  }
};