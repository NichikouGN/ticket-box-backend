import cron from "node-cron";
import db from "../db/knex.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import type { NotificationPayload } from "../types/notification.types.js";

export const startReminderCron = () => {
  let running = false;

  cron.schedule("0 * * * * *", async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      logger.info("[REMINDER CRON] Fetching pending reminders from notifications_reminders table");
      const pendingReminders = await db("notifications_reminders")
        .where("processed_at", null)
        .where("scheduled_at", "<=", db.fn.now())
        .orderBy("scheduled_at", "asc")
        .limit(100)
        .forUpdate()
        .skipLocked();

      for (const reminder of pendingReminders) {
        await handlePendingReminders(reminder);
      }
    } catch (err) {
      logger.error({ err }, "[REMINDER CRON] Failed to process pending reminders");
    } finally {
      running = false;
    }
  });

  const handlePendingReminders = async (reminder: { id: string; user_id: string; metadata: NotificationPayload }) => {
    try {
      await db.transaction(async (trx) => {
        await OutboxRepository.createNotificationOutboxEvent(
          trx,
          "REMINDER_24H",
          reminder.metadata,
          `reminder_24h-${reminder.metadata.orderId}`,
          30,
        );
        await trx("notifications_reminders").where({ id: reminder.id }).update({ processed_at: db.fn.now() });
      });
    } catch (err) {
      logger.error({ err }, "[REMINDER CRON] Failed to create notification event for pending reminder");
    }
  };
};

startReminderCron();
