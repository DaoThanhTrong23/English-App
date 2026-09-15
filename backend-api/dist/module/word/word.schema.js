import { z } from 'zod';
export const getWordsQuerySchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    cefrLevel: z.string().optional(),
    search: z.string().optional(),
});
export const createWordSchema = z.object({
    headword: z.string().min(1, 'Không được để trống headword'),
    partOfSpeech: z.string().nullish(),
    cefrLevel: z.string().nullish(),
    phonetic: z.string().nullish(),
    audioUrl: z.string().nullish(),
    imageUrl: z.string().nullish(),
    meaning: z.string().min(1, 'Meaning không được để trống').nullish(),
    exampleSentence: z.string().nullish(),
});
export const updateWordSchema = createWordSchema.partial();
