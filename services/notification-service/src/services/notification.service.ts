import { NotificationRepository } from "../repository/notification.repository.js";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";

export const NotificationService = {
  async getNotificationsForUser(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [result, totalCount] = await Promise.all([
      NotificationRepository.getNotificationsForUser(db, userId, offset, limit),
      NotificationRepository.getNotificationCount(db, userId),
    ]);

    console.log("Fetched notifications for user:", result);
    return { data: result, total: totalCount };
  },

  async getDetailedNotification(userId: string, notificationId: string) {
    try {
      const result = await NotificationRepository.getDetailedNotification(db, userId, notificationId);
      if (!result) {
        throw new AppError("Notification not found", 404);
      }

      return result;
    } catch (error) {
      console.error("Error fetching detailed notification:", error);
      throw new AppError("Internal Server Error", 500);
    }
  },
};
