import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, writeAuditLog } from '../../utils/helpers.js';

const schema = z.object({
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title: z.string().min(5).max(200),
  excerpt: z.string().min(10).max(500),
  content: z.string().max(50000).optional().nullable(),
  category: z.string().min(1).max(80),
  readTime: z.string().max(40).optional().nullable(),
  isPublished: z.boolean().default(false)
});

export function registerAdminBlogRoutes(router: Router) {
  router.get(
    '/admin/blog',
    authRequired,
    allowRoles(Role.ADMIN, Role.MARKETING),
    asyncRoute(async (_req, res) => {
      const posts = await prisma.blogPost.findMany({
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
      });
      res.json({ posts });
    })
  );

  router.post(
    '/admin/blog',
    authRequired,
    allowRoles(Role.ADMIN, Role.MARKETING),
    asyncRoute(async (req, res) => {
      const body = schema.parse(req.body);
      const post = await prisma.blogPost.create({
        data: { ...body, publishedAt: body.isPublished ? new Date() : null }
      });
      await writeAuditLog({ actorId: req.user!.id, actorRole: req.user!.role, action: 'blog.create', targetType: 'blog_post', targetId: post.id, summary: `Blog post "${body.title}" created.` });
      res.status(201).json({ post });
    })
  );

  router.patch(
    '/admin/blog/:id',
    authRequired,
    allowRoles(Role.ADMIN, Role.MARKETING),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const body = schema.partial().parse(req.body);
      const existing = await prisma.blogPost.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true } });
      if (!existing) return res.status(404).json({ message: 'Post not found' });

      const publishedAt =
        body.isPublished === true && !existing.publishedAt
          ? new Date()
          : body.isPublished === false
            ? null
            : undefined;

      const post = await prisma.blogPost.update({
        where: { id },
        data: { ...body, ...(publishedAt !== undefined ? { publishedAt } : {}) }
      });
      await writeAuditLog({ actorId: req.user!.id, actorRole: req.user!.role, action: 'blog.update', targetType: 'blog_post', targetId: id, summary: `Blog post "${post.title}" updated.` });
      res.json({ post });
    })
  );

  router.delete(
    '/admin/blog/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const post = await prisma.blogPost.delete({ where: { id } });
      await writeAuditLog({ actorId: req.user!.id, actorRole: req.user!.role, action: 'blog.delete', targetType: 'blog_post', targetId: id, summary: `Blog post "${post.title}" deleted.` });
      res.json({ message: 'Post deleted.' });
    })
  );
}
