import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { GetCoursesQueryInput } from "./course.schema.js";

export class CourseRepository {
  @logExecution()
  async findWithPagination(filter: GetCoursesQueryInput) {
    const { page, limit, search, cefrLevel, isDeleted, sortBy, sortOrder, topicId } = filter;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: isDeleted ? { not: null } : null,
    };

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (cefrLevel) { whereCondition.cefrLevel = cefrLevel; }

    if (topicId) { whereCondition.topicId = topicId; }

    const [totalItems, courses] = await Promise.all([
      prisma.lesson.count({ where: whereCondition }),
      prisma.lesson.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          topicId: true,
          title: true,
          description: true,
          cefrLevel: true,
          thumbnailUrl: true,
          createdAt: true,
          deletedAt: true,
          topic: {
            select: {
              title: true
            }
          },
          _count: {
            select: {
              lessonWords: true,
            },
          },
        },
      }),
    ]);

    return { totalItems, courses };
  }

  @logExecution()
  async findById(id: number, includeDeleted = false) {
    const whereCondition: any = { id };
    if (!includeDeleted) {
      whereCondition.deletedAt = null;
    }

    return prisma.lesson.findFirst({
      where: whereCondition,
      include: {
        lessonWords: {
          include: {
            word: {
              select: {
                id: true,
                headword: true,
                partOfSpeech: true,
                cefrLevel: true,
                phonetic: true,
                audioUrl: true,
                imageUrl: true,
                meaning: true,
                exampleSentence: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessonWords: true,
          },
        },
      },
    });
  }

  @logExecution()
  async countCourses() {
    return prisma.lesson.count({
      where: {
        deletedAt: null,
      },
    });
  }

  @logExecution()
  async checkWordsExist(wordIds: number[]) {
    if (!wordIds || wordIds.length === 0) return [];
    const foundWords = await prisma.word.findMany({
      where: {
        id: { in: wordIds },
      },
      select: { id: true },
    });
    return foundWords.map((w) => w.id);
  }

  @logExecution()
  async createCourse(data: {
    topicId?: number | null;
    title: string;
    description?: string | null;
    content?: string | null;
    videoUrl?: string | null;
    cefrLevel?: string | null;
    thumbnailUrl?: string | null;
    wordIds?: number[];
  }) {
    const { wordIds, ...courseData } = data;

    return prisma.$transaction(async (tx) => {
      const course = await tx.lesson.create({
        data: {
          topicId: courseData.topicId ?? null,
          title: courseData.title,
          description: courseData.description ?? null,
          content: courseData.content ?? null,
          videoUrl: courseData.videoUrl ?? null,
          cefrLevel: courseData.cefrLevel ?? null,
          thumbnailUrl: courseData.thumbnailUrl ?? null,
        },
      });

      if (wordIds && wordIds.length > 0) {
        await tx.lessonWord.createMany({
          data: wordIds.map((wordId) => ({
            lessonId: course.id,
            wordId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.lesson.findUnique({
        where: { id: course.id },
        include: {
          lessonWords: {
            include: {
              word: true,
            },
          },
          _count: {
            select: {
              lessonWords: true,
            },
          },
        },
      });
    });
  }

  @logExecution()
  async updateCourse(
    id: number,
    data: {
      topicId?: number | null;
      title?: string;
      description?: string | null;
      content?: string | null;
      videoUrl?: string | null;
      cefrLevel?: string | null;
      thumbnailUrl?: string | null;
      wordIds?: number[];
    }
  ) {
    const { wordIds, ...courseData } = data;

    return prisma.$transaction(async (tx) => {
      const updatePayload: any = {};
      if (courseData.topicId !== undefined) updatePayload.topicId = courseData.topicId;
      if (courseData.title !== undefined) updatePayload.title = courseData.title;
      if (courseData.description !== undefined) updatePayload.description = courseData.description;
      if (courseData.content !== undefined) updatePayload.content = courseData.content;
      if (courseData.videoUrl !== undefined) updatePayload.videoUrl = courseData.videoUrl;
      if (courseData.cefrLevel !== undefined) updatePayload.cefrLevel = courseData.cefrLevel;
      if (courseData.thumbnailUrl !== undefined) updatePayload.thumbnailUrl = courseData.thumbnailUrl;

      if (Object.keys(updatePayload).length > 0) {
        await tx.lesson.update({
          where: { id },
          data: updatePayload,
        });
      }

      // Nếu có truyền mảng wordIds, đồng bộ lại quan hệ
      if (wordIds !== undefined) {
        await tx.lessonWord.deleteMany({
          where: { lessonId: id },
        });

        if (wordIds.length > 0) {
          await tx.lessonWord.createMany({
            data: wordIds.map((wordId) => ({
              lessonId: id,
              wordId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.lesson.findUnique({
        where: { id },
        include: {
          lessonWords: {
            include: {
              word: true,
            },
          },
          _count: {
            select: {
              lessonWords: true,
            },
          },
        },
      });
    });
  }

  @logExecution()
  async softDelete(id: number) {
    return prisma.lesson.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  @logExecution()
  async restore(id: number) {
    return prisma.lesson.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  @logExecution()
  async addWordsToCourse(courseId: number, wordIds: number[]) {
    await prisma.lessonWord.createMany({
      data: wordIds.map((wordId) => ({
        lessonId: courseId,
        wordId,
      })),
      skipDuplicates: true,
    });

    return this.findById(courseId);
  }

  @logExecution()
  async findLessonWord(courseId: number, wordId: number) {
    return prisma.lessonWord.findUnique({
      where: {
        lessonId_wordId: {
          lessonId: courseId,
          wordId,
        },
      },
    });
  }

  @logExecution()
  async removeWordFromCourse(courseId: number, wordId: number) {
    return prisma.lessonWord.delete({
      where: {
        lessonId_wordId: {
          lessonId: courseId,
          wordId,
        },
      },
    });
  }
}

export const courseRepository = new CourseRepository();
