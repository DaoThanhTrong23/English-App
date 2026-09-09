import { PrismaClient } from '@prisma/client';
import { CreateWordInput, UpdateWordInput } from './word.schema.js';

const prisma = new PrismaClient(); 

export const wordRepository = {
  async getWords(page: number, limit: number, cefrLevel?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};
    if (cefrLevel) whereCondition.cefrLevel = cefrLevel;
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
  async createWord(data: CreateWordInput) {
    return prisma.word.create({ data });
  },

  // SỬA TỪ
  async updateWord(id: string, data: UpdateWordInput) {
    return await prisma.word.update({
      where: { id: Number(id) },
      data,
    });
  },

  // XÓA TỪ
  async deleteWord(id: string) {
    return await prisma.word.delete({
      where: { id: Number(id) }
    });
  }
};