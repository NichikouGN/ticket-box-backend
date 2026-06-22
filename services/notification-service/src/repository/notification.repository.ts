import type { Knex } from "knex";
import type { NotificationPayload } from "../types/notification.types.js";
type DB = Knex | Knex.Transaction;

export const NotificationRepository = {
  async insertNotification(
    db: DB,
    userId: string,
    title: string,
    message: string,
    type: "ORDER_CONFIRMATION" | "REMINDER_24H",
    notificationIdempotency: string,
  ) {
    await db("notifications").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      idempotency_key: notificationIdempotency,
      title: title,
      message: message,
      type: type,
      user_status: "UNREAD",
      created_at: db.fn.now(),
    });
  },

  async setReminder(db: DB, userId: string, eventDate: string, metadata: NotificationPayload) {
    await db("notifications_reminders").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      metadata: JSON.stringify(metadata),
      created_at: db.fn.now(),
      scheduled_at: db.raw(`DATE_SUB(?, INTERVAL 24 HOUR)`, [eventDate]),
      processed_at: null,
    });
  },
};
