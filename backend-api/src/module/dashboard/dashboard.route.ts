import { Router } from 'express';
import { dashboardService } from './dashboard.service.js';
import { Authenticate } from '../../middleware/authenticate.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { asyncHandler } from '../../shared/http/async-handler.js';

const dashboardRouter = Router();

dashboardRouter.get('/stats', Authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  res.status(200).json({
    success: true,
    data: stats
  });
}));

export default dashboardRouter;
