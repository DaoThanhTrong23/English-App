import { ApiError } from '../../shared/http/api-error.js';
import { wordRepository } from './word.repository.js';
import { CreateWordInput, UpdateWordInput, GetWordsQueryInput } from './word.schema.js';

export const wordService = {
  async fetchWords(query: GetWordsQueryInput) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const result = await wordRepository.getWords(query);
    return {
      data: result.words,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit) || 1,
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

  async restoreWord(id: string) {
    return await wordRepository.restoreWord(id);
  },

  async countWord(){
    return await wordRepository.countWord();
  }
};
