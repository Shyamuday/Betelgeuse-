import { z } from 'zod';

export const homeAnnouncementSchema = z.object({
  text: z.string().trim().min(1).max(500),
  linkLabel: z.string().trim().max(80).nullable().optional(),
  linkUrl: z.string().trim().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional()
});
