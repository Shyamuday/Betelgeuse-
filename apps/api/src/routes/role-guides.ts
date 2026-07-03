import { Router } from 'express';
import { getRoleTaskGuide, listRoleTaskGuides } from '../constants/role-task-guides.js';

export const roleGuidesRouter = Router();

roleGuidesRouter.get('/', (req, res) => {
  const appKey = typeof req.query.app === 'string' ? req.query.app : undefined;
  res.json({ guides: listRoleTaskGuides(appKey) });
});

roleGuidesRouter.get('/:appKey', (req, res) => {
  const variantKey = typeof req.query.variant === 'string' ? req.query.variant : undefined;
  const guide = getRoleTaskGuide(req.params.appKey, variantKey);
  if (!guide) {
    res.status(404).json({ error: 'Guide not found for this app' });
    return;
  }
  res.json({ guide });
});
