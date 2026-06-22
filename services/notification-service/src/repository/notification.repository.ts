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

  async getNotificationsForUser(db: DB, userId: string, offset: number, limit: number) {
    const notifications = await db("notifications")
      .where("user_id", userId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return notifications.map((n) => ({
      id: n.id,
      eventType: n.event_type,
      title: n.title,
      message: n.message,
      userStatus: n.user_status,
      createdAt: n.created_at,
    }));
  },
};
