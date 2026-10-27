import { prisma } from "../../config/prisma.js";

export class TopicRepository {
  async findAll(cefrLevel?: string, includeDeleted = true) {
    const whereCondition: any = {};
    if (cefrLevel) {
      whereCondition.cefrLevel = cefrLevel;
    }
    if (!includeDeleted) {
      whereCondition.deletedAt = null;
    }
    return await prisma.topic.findMany({
      where: whereCondition,
      include: { lessons: true },
      orderBy: { id: "asc" }
    });
  }

  async findById(id: number) {
    return await prisma.topic.findUnique({
      where: { id },
      include: { lessons: true }
    });
  }

  async create(data: any) {
    return await prisma.topic.create({ data });
  }

  async update(id: number, data: any) {
    return await prisma.topic.update({
      where: { id },
      data
    });
  }

  async delete(id: number) {
    const now = new Date();
    // Xóa mềm chủ đề (giữ nguyên các bài học bên dưới để học viên đã đăng ký trước đó vẫn tiếp tục học được)
    return await prisma.topic.update({
      where: { id },
      data: { deletedAt: now }
    });
  }

  async restore(id: number) {
    // Khôi phục chủ đề
    return await prisma.topic.update({
      where: { id },
      data: { deletedAt: null }
    });
  }
}

export const topicRepository = new TopicRepository();
