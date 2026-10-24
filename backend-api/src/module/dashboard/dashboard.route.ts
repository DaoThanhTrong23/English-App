import { Router } from 'express';
import { dashboardService } from './dashboard.service.js';
import { Authenticate } from '../../middleware/authenticate.middleware.js';
import { requirePermission } from '../../middleware/authorize.middleware.js';
import { PermissionName } from '../../generated/prisma/index.js';
import { asyncHandler } from '../../shared/http/async-handler.js';

const dashboardRouter = Router();

dashboardRouter.get(
  '/stats',
  Authenticate,
  requirePermission(PermissionName.READ_DASHBOARD_STATS),
  asyncHandler(async (req, res) => {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

export default dashboardRouter;
