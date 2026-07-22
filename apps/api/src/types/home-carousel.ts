import { z } from 'zod';

export const carouselImageUploadSchema = z
  .object({
    mimeType: z.string().min(3).max(80),
    fileName: z.string().max(200).optional(),
    dataBase64: z.string().min(1)
  })
  .optional();

export const homeCarouselSlideSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(500).nullable().optional(),
  eyebrow: z.string().trim().max(80).nullable().optional(),
  imageAlt: z.string().trim().max(200).nullable().optional(),
  externalImageUrl: z.string().trim().url().max(500).nullable().optional().or(z.literal('')),
  actionLabel: z.string().trim().max(80).nullable().optional(),
  actionType: z.enum(['BOOK', 'INTERNAL_LINK', 'EXTERNAL_LINK']).optional(),
  actionUrl: z.string().trim().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  imageUpload: carouselImageUploadSchema
});
