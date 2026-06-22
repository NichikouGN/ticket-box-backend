import cron from "node-cron";
import db from "../db/knex.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export const startReminderCron = () => {
  let running = false;

  cron.schedule("0 * * * * *", async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const pendingReminders = await db("notifications_reminders")
        .where("processed_at", null)
        // .where("scheduled_at", "<=", db.fn.now())
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

  const handlePendingReminders = async (reminder: any) => {
    try {
      await OutboxRepository.createNotificationEvent(db, "REMINDER_24H", 30, reminder.metadata);
    } catch (err) {
      logger.error({ err }, "[REMINDER CRON] Failed to create notification event for pending reminder");
    }
  };
};

startReminderCron();
