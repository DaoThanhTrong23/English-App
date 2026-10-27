import { z } from 'zod';

export const getWordsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  cefrLevel: z.string().optional(),
  partOfSpeech: z.string().optional(),
  hasImage: z.enum(['all', 'yes', 'no']).optional().default('all'),
  hasAudio: z.enum(['all', 'yes', 'no']).optional().default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['headword', 'cefrLevel', 'partOfSpeech', 'createdAt', 'id']).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export const createWordSchema = z.object({
  headword: z.string().trim().min(1, 'Không được để trống headword'),
  partOfSpeech: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  cefrLevel: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  phonetic: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  audioUrl: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  imageUrl: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  meaning: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
  exampleSentence: z.string().nullish().transform(v => (v && v.trim()) ? v.trim() : null),
});

export const updateWordSchema = createWordSchema.partial();

// Hỗ trợ cả mảng [word1, word2] và đối tượng { words: [word1, word2] }
export const createBulkWordSchema = z.union([
  z.array(createWordSchema),
  z.object({
    words: z.array(createWordSchema)
  }).transform(val => val.words)
]);

export type GetWordsQueryInput = z.infer<typeof getWordsQuerySchema>;
export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;
