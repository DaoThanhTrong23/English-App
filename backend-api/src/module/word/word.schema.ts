import { z } from 'zod';

export const getWordsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  cefrLevel: z.string().optional(),
  search: z.string().optional(), 
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
export const createBulkWordSchema = z.array(createWordSchema);

export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;