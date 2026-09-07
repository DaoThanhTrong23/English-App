import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); 

export const wordRepository = {
  async getWords(page: number, limit: number, cefrLevel?: string) {
    const skip = (page - 1) * limit;
    
    const whereCondition = cefrLevel ? { cefr_level: cefrLevel } : {};

    const [words, total] = await Promise.all([
      prisma.words.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
      }),
      prisma.words.count({ where: whereCondition })
    ]);

    return { words, total };
  }
  
};