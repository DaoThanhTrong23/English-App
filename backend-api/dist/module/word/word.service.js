import { wordRepository } from './word.repository.js';
export const wordService = {
    async fetchWords(page, limit, cefrLevel, search) {
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
    async createWord(data) {
        return await wordRepository.createWord(data);
    },
    async updateWord(id, data) {
        return await wordRepository.updateWord(id, data);
    },
    async deleteWord(id) {
        return await wordRepository.deleteWord(id);
    },
    async countWord() {
        return await wordRepository.countWord();
    }
};
