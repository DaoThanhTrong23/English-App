import { activityLogRepository } from "./activity-log.repository.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class ActivityLogService {
  @logExecution()
  async getActivities(page: number = 1, limit: number = 20, search?: string, actionType?: string) {
    const skip = (page - 1) * limit;
    const { total, items } = await activityLogRepository.findActivities(skip, limit, search, actionType);
    return {
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit,
      },
      items,
    };
  }

  @logExecution()
  async getLoginLogs(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const { total, items } = await activityLogRepository.findLoginLogs(skip, limit, search);
    return {
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit,
      },
      items,
    };
  }
}

export const activityLogService = new ActivityLogService();
