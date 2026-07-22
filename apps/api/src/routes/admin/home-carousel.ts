import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, writeAuditLog } from '../../utils/helpers.js';
import { homeCarouselSlideSchema } from '../../types/home-carousel.js';
import {
  deletePublicCarouselImage,
  savePublicCarouselImage
} from '../../services/public-carousel-image-storage.js';

function mapUploadError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNSUPPORTED_MIME')
    return { status: 400, message: 'Only JPEG, PNG, and WebP images are allowed.' };
  if (code === 'EMPTY_FILE') return { status: 400, message: 'Image file is empty.' };
  if (code === 'FILE_TOO_LARGE') return { status: 400, message: 'Image must be 3 MB or smaller.' };
  return { status: 500, message: 'Could not save carousel image.' };
}

function slideImageUrl(slide: {
  id: string;
  imageKey: string | null;
  externalImageUrl: string | null;
}) {
  return slide.imageKey ? `/home-carousel/${slide.id}/image` : slide.externalImageUrl;
}

export function registerAdminHomeCarouselRoutes(router: Router) {
  router.get(
    '/admin/home-carousel',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const slides = await prisma.homeCarouselSlide.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      });
      res.json({ slides: slides.map((slide) => ({ ...slide, imageUrl: slideImageUrl(slide) })) });
    })
  );

  router.post(
    '/admin/home-carousel',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = homeCarouselSlideSchema.parse(req.body);
      let imageKey: string | null = null;
      if (body.imageUpload) {
        try {
          imageKey = (await savePublicCarouselImage(body.imageUpload)).storageKey;
        } catch (error) {
          const mapped = mapUploadError(error);
          return res.status(mapped.status).json({ message: mapped.message });
        }
      }

      const slide = await prisma.homeCarouselSlide.create({
        data: {
          title: body.title,
          subtitle: body.subtitle || null,
          eyebrow: body.eyebrow || null,
          imageAlt: body.imageAlt || null,
          imageKey,
          externalImageUrl: imageKey ? null : body.externalImageUrl || null,
          actionLabel: body.actionLabel || null,
          actionType: body.actionType || 'BOOK',
          actionUrl: body.actionUrl || null,
          isPublished: body.isPublished ?? true,
          sortOrder: body.sortOrder ?? 0,
          startsAt: body.startsAt ?? null,
          endsAt: body.endsAt ?? null
        }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_carousel.create',
        targetType: 'home_carousel_slide',
        targetId: slide.id,
        summary: `Home carousel slide "${slide.title}" created.`
      });
      res.status(201).json({ slide: { ...slide, imageUrl: slideImageUrl(slide) } });
    })
  );

  router.patch(
    '/admin/home-carousel/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const body = homeCarouselSlideSchema.partial().parse(req.body);
      const existing = await prisma.homeCarouselSlide.findUniqueOrThrow({ where: { id } });
      let imageKey = existing.imageKey;

      if (body.imageUpload) {
        try {
          imageKey = (await savePublicCarouselImage(body.imageUpload)).storageKey;
        } catch (error) {
          const mapped = mapUploadError(error);
          return res.status(mapped.status).json({ message: mapped.message });
        }
      }

      const slide = await prisma.homeCarouselSlide.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.subtitle !== undefined ? { subtitle: body.subtitle || null } : {}),
          ...(body.eyebrow !== undefined ? { eyebrow: body.eyebrow || null } : {}),
          ...(body.imageAlt !== undefined ? { imageAlt: body.imageAlt || null } : {}),
          ...(body.imageUpload ? { imageKey, externalImageUrl: null } : {}),
          ...(!body.imageUpload && body.externalImageUrl !== undefined
            ? { externalImageUrl: body.externalImageUrl || null }
            : {}),
          ...(body.actionLabel !== undefined ? { actionLabel: body.actionLabel || null } : {}),
          ...(body.actionType !== undefined ? { actionType: body.actionType } : {}),
          ...(body.actionUrl !== undefined ? { actionUrl: body.actionUrl || null } : {}),
          ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.startsAt !== undefined ? { startsAt: body.startsAt } : {}),
          ...(body.endsAt !== undefined ? { endsAt: body.endsAt } : {})
        }
      });

      if (body.imageUpload && existing.imageKey && existing.imageKey !== slide.imageKey) {
        await deletePublicCarouselImage(existing.imageKey);
      }

      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_carousel.update',
        targetType: 'home_carousel_slide',
        targetId: slide.id,
        summary: `Home carousel slide "${slide.title}" updated.`
      });
      res.json({ slide: { ...slide, imageUrl: slideImageUrl(slide) } });
    })
  );

  router.delete(
    '/admin/home-carousel/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const slide = await prisma.homeCarouselSlide.delete({ where: { id } });
      await deletePublicCarouselImage(slide.imageKey);
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_carousel.delete',
        targetType: 'home_carousel_slide',
        targetId: id,
        summary: `Home carousel slide "${slide.title}" deleted.`
      });
      res.json({ message: 'Home carousel slide deleted.' });
    })
  );
}
