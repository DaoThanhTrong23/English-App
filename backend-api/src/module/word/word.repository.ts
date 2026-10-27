import { prisma } from '../../config/prisma.js';
import { CreateWordInput, UpdateWordInput, GetWordsQueryInput } from './word.schema.js';
import { logExecution } from '../../shared/decorators/log.decorator.js'; 

export const wordRepository = {
  async getWords(query: GetWordsQueryInput) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const conditions: any[] = [];

    // Lọc theo Cấp độ CEFR
    if (query.cefrLevel && query.cefrLevel !== 'all') {
      conditions.push({ cefrLevel: query.cefrLevel });
    }

    // Lọc theo Loại từ
    if (query.partOfSpeech && query.partOfSpeech !== 'all') {
      conditions.push({ partOfSpeech: query.partOfSpeech });
    }

    // Lọc theo Có hình ảnh
    if (query.hasImage === 'yes') {
      conditions.push({
        AND: [
          { imageUrl: { not: null } },
          { imageUrl: { not: '' } }
        ]
      });
    } else if (query.hasImage === 'no') {
      conditions.push({
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      });
    }

    // Lọc theo Có file âm thanh
    if (query.hasAudio === 'yes') {
      conditions.push({
        AND: [
          { audioUrl: { not: null } },
          { audioUrl: { not: '' } }
        ]
      });
    } else if (query.hasAudio === 'no') {
      conditions.push({
        OR: [
          { audioUrl: null },
          { audioUrl: '' }
        ]
      });
    }

    // Tìm kiếm đồng thời headword và meaning tiếng Việt
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim();
      conditions.push({
        OR: [
          { headword: { contains: s } },
          { meaning: { contains: s } }
        ]
      });
    }

    const whereCondition = conditions.length > 0 ? { AND: conditions } : {};

    const orderBy: any = {};
    const sortBy = query.sortBy || 'id';
    const sortOrder = query.sortOrder || 'asc';
    orderBy[sortBy] = sortOrder;

    const [words, total] = await Promise.all([
      prisma.word.findMany({ 
        where: whereCondition, 
        skip: skip, 
        take: limit,
        orderBy: orderBy
      }),
      prisma.word.count({ where: whereCondition })
    ]);
    return { words, total };
  },

  async findExactWord(headword: string, partOfSpeech?: string | null) {
    return prisma.word.findFirst({
      where: {
        headword: headword,
        partOfSpeech: partOfSpeech || null
      }
    });
  },

  // THÊM TỪ MỚI
  async createWord(data: CreateWordInput) {
    return prisma.word.create({ data });
  },

  async createBulkWords(data: CreateWordInput[]) {
    return prisma.word.createMany({ data, skipDuplicates: true });
  },

  // SỬA TỪ
  async updateWord(id: string, data: UpdateWordInput) {
    return await prisma.word.update({
      where: { id: Number(id) },
      data,
    });
  },

  // XÓA MỀM TỪ
  async deleteWord(id: string) {
    return await prisma.word.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() }
    });
  },

  // KHÔI PHỤC TỪ
  async restoreWord(id: string) {
    return await prisma.word.update({
      where: { id: Number(id) },
      data: { deletedAt: null }
    });
  },

  async countWord(){
    return prisma.word.count();
  }
};
