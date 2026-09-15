import { prisma } from '../../config/prisma.js';
export const wordRepository = {
    async getWords(page, limit, cefrLevel, search) {
        const skip = (page - 1) * limit;
        const whereCondition = {};
        if (cefrLevel)
            whereCondition.cefrLevel = cefrLevel;
        if (search) {
            whereCondition.headword = { contains: search };
        }
        const [words, total] = await Promise.all([
            prisma.word.findMany({ where: whereCondition, skip: skip, take: limit }),
            prisma.word.count({ where: whereCondition })
        ]);
        return { words, total };
    },
    // THÊM TỪ
    async createWord(data) {
        return prisma.word.create({ data });
    },
    // SỬA TỪ
    async updateWord(id, data) {
        return await prisma.word.update({
            where: { id: Number(id) },
            data,
        });
    },
    // XÓA TỪ
    async deleteWord(id) {
        return await prisma.word.delete({
            where: { id: Number(id) }
        });
    },
    async countWord() {
        return prisma.word.count();
    }
};
