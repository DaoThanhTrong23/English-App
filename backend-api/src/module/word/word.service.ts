import { ApiError } from '../../shared/http/api-error.js';
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
    const existing = await wordRepository.findExactWord(data.headword, data.partOfSpeech);
    if (existing) {
      throw new ApiError(400, "word_exists", "Từ vựng này đã tồn tại trong kho (trùng từ và loại từ)!");
    }
    return await wordRepository.createWord(data);
  },

  async createBulkWords(data: CreateWordInput[]) {
    return await wordRepository.createBulkWords(data);
  },

  async updateWord(id: string, data: UpdateWordInput) {
    if (data.headword) {
      const existing = await wordRepository.findExactWord(data.headword, data.partOfSpeech);
      if (existing && existing.id !== Number(id)) {
        throw new ApiError(400, "word_exists", "Từ vựng này đã tồn tại trong kho (trùng từ và loại từ)!");
      }
    }
    return await wordRepository.updateWord(id, data);
  },

  async deleteWord(id: string) {
    return await wordRepository.deleteWord(id);
  },


  async countWord(){
    return await wordRepository.countWord();
  }
};