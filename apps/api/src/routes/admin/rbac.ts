import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { asyncRoute } from '../../utils/helpers.js';
import { RBAC_CAPABILITIES, RBAC_ROLES } from '../../constants/rbac-matrix.constants.js';

export function registerAdminRbacRoutes(router: Router) {
  router.get(
    '/admin/rbac/matrix',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      res.json({
        roles: RBAC_ROLES,
        capabilities: RBAC_CAPABILITIES,
        matrix: RBAC_ROLES.map((role) => ({
          role,
          capabilities: RBAC_CAPABILITIES.filter((cap) => cap.roles.includes(role)).map((cap) => cap.id)
        }))
      });
    })
  );
}
