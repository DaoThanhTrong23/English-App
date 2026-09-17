import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import { achievementRepository, AchievementRepository } from "./achievement.repository.js";
import { CreateAchievementInput, UpdateAchievementInput } from "./achievement.schema.js";

export class AchievementService {
  constructor(private repo: AchievementRepository = achievementRepository) {}

  @logExecution()
  async getList() {
    return this.repo.findAll();
  }

  @logExecution()
  @recordActivity("ADMIN_CREATE_ACHIEVEMENT", (result, data, adminId) => 
    `Admin ID ${adminId ?? "Unknown"} tạo danh hiệu mới "${data?.title}"`
  )
  async create(data: CreateAchievementInput, adminId?: number) {
    return this.repo.create(data);
  }

  @logExecution()
  @recordActivity("ADMIN_UPDATE_ACHIEVEMENT", (result, id, data, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} cập nhật danh hiệu ID ${id}`
  )
  async update(id: number, data: UpdateAchievementInput, adminId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new ApiError(404, "not_found", "Không tìm thấy danh hiệu");
    return this.repo.update(id, data);
  }

  @logExecution()
  @recordActivity("ADMIN_DELETE_ACHIEVEMENT", (result, id, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} xóa danh hiệu ID ${id}`
  )
  async delete(id: number, adminId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new ApiError(404, "not_found", "Không tìm thấy danh hiệu");
    await this.repo.delete(id);
    return { success: true, message: "Xóa danh hiệu thành công" };
  }
}

export const achievementService = new AchievementService();
