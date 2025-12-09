import { z } from 'zod';

export const transcribeRequestSchema = z.object({
  audioUrl: z.string().url(),
  language: z.string().optional(),
  lectureId: z.string(),
  userId: z.string(),
});

export const generateNotesRequestSchema = z.object({
  transcript: z.string().min(1),
  lectureId: z.string(),
  userId: z.string(),
  options: z.object({
    style: z.enum(['detailed', 'concise', 'bullet']).optional(),
    includeTimestamps: z.boolean().optional(),
    topics: z.array(z.string()).optional(),
  }).optional(),
});

export const searchRequestSchema = z.object({
  query: z.string().min(1),
  userId: z.string(),
  filters: z.object({
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    courseCode: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export function validateAudioFormat(mimeType: string): boolean {
  const allowedFormats = (process.env.ALLOWED_AUDIO_FORMATS || '')
    .split(',')
    .map(f => f.trim());
  return allowedFormats.includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '26214400', 10);
  return size <= maxSize;
}
