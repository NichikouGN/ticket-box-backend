import { NotificationRepository } from "../repository/notification.repository.js";
import db from "../db/knex.js";

export const NotificationService = {
  async getNotificationsForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<
    {
      id: string;
      eventType: string;
      title: string;
      message: string;
      userStatus: string;
      createdAt: Date;
    }[]
  > {
    const offset = (page - 1) * limit;
    const result = await NotificationRepository.getNotificationsForUser(db, userId, offset, limit);
    return result;
  },
};
