import { prisma } from "../../config/prisma.js";

export class TopicRepository {
  async findAll(cefrLevel?: string) {
    const whereCondition: any = {};
    if (cefrLevel) {
      whereCondition.cefrLevel = cefrLevel;
    }
    return await prisma.topic.findMany({
      where: whereCondition,
      include: { lessons: true }
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
    return await prisma.topic.delete({
      where: { id }
    });
  }
}

export const topicRepository = new TopicRepository();
