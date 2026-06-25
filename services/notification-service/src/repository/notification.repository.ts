import type { Knex } from "knex";
import type { NotificationPayload } from "../types/notification.types.js";
type DB = Knex | Knex.Transaction;

export const NotificationRepository = {
  async insertNotification(
    db: DB,
    notificationId: string,
    userId: string,
    title: string,
    message: string,
    type: "ORDER_CONFIRMATION" | "REMINDER_24H",
    notificationIdempotency: string,
    createdAt: Date,
  ) {
    await db("notifications").insert({
      id: notificationId,
      user_id: userId,
      idempotency_key: notificationIdempotency,
      title: title,
      message: message,
      type: type,
      user_status: "UNREAD",
      created_at: createdAt,
    });
  },

  async setReminder(db: DB, userId: string, eventDate: Date, metadata: NotificationPayload) {
    await db("notifications_reminders").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      metadata: metadata,
      created_at: db.fn.now(),
      scheduled_at: eventDate,
      processed_at: null,
    });
  },

  async getNotificationsForUser(
    db: DB,
    userId: string,
    offset: number,
    limit: number,
  ): Promise<
    {
      id: string;
      type: string;
      title: string;
      userStatus: string;
      createdAt: Date;
    }[]
  > {
    const notifications = await db("notifications")
      .select("id", "type", "title", "user_status", "created_at")
      .where("user_id", userId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      userStatus: n.user_status,
      createdAt: n.created_at,
    }));
  },

  async getNotificationCount(db: DB, userId: string): Promise<number> {
    const result = await db("notifications").where("user_id", userId).count("id as total").first();
    if (!result) {
      return 0;
    }
    return Number(result.total);
  },
  async getDetailedNotification(
    db: DB,
    userId: string,
    notificationId: string,
  ): Promise<{
    id: string;
    type: string;
    title: string;
    message: string;
    userStatus: string;
    createdAt: Date;
  } | null> {
    const notification = await db("notifications")
      .select("id", "type", "title", "message", "user_status", "created_at")
      .where({ user_id: userId, id: notificationId })
      .first();

    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userStatus: notification.user_status,
      createdAt: notification.created_at,
    };
  },
};
