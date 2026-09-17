import { topicRepository, TopicRepository } from "./topic.repository.js";
import { ApiError } from "../../shared/http/api-error.js";

export class TopicService {
  constructor(private topicRepo: TopicRepository) {}

  async getAllTopics() {
    return await this.topicRepo.findAll();
  }

  async getTopicById(id: number) {
    const topic = await this.topicRepo.findById(id);
    if (!topic) throw new ApiError(404, "not_found", "Chủ đề không tồn tại");
    return topic;
  }

  async createTopic(data: any) {
    return await this.topicRepo.create(data);
  }

  async updateTopic(id: number, data: any) {
    const topic = await this.topicRepo.findById(id);
    if (!topic) throw new ApiError(404, "not_found", "Chủ đề không tồn tại");
    return await this.topicRepo.update(id, data);
  }

  async deleteTopic(id: number) {
    const topic = await this.topicRepo.findById(id);
    if (!topic) throw new ApiError(404, "not_found", "Chủ đề không tồn tại");
    return await this.topicRepo.delete(id);
  }
}

export const topicService = new TopicService(topicRepository);
