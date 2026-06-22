import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import db from "../db/knex.js";
import { handleInAppNotification } from "../jobs/handleInAppNotification.job.js";
import { handleEmailNotification } from "../jobs/handleEmailNotification.job.js";
import { handleSet24hReminder } from "../jobs/handleSet24hReminder.job.js";

export const createNotificationWorker = async () => {
  const worker = new Worker(
    "notification-queue",
    async (job) => {
      switch (job.name) {
        case "NOTIFY_USER":
          db.transaction(async (trx) => {
            await OutboxRepository.createNotificationEvent(trx, "IN_APP_NOTIFICATION", 30, job.data);
            await OutboxRepository.createNotificationEvent(trx, "EMAIL_NOTIFICATION", 60, job.data);
            await OutboxRepository.createNotificationEvent(trx, "SET_24H_REMINDER", 90, job.data);
          });
          break;
        case "IN_APP_NOTIFICATION":
          await handleInAppNotification(job, "ORDER_CONFIRMATION");
          break;
        case "EMAIL_NOTIFICATION":
          await handleEmailNotification(job, "ORDER_CONFIRMATION");
          break;
        case "SET_24H_REMINDER":
          await handleSet24hReminder(job);
          break;
        case "REMINDER_24H":
          db.transaction(async (trx) => {
            await OutboxRepository.createNotificationEvent(trx, "24H_IN_APP_NOTIFICATION", 30, job.data);
            await OutboxRepository.createNotificationEvent(trx, "24H_EMAIL_NOTIFICATION", 60, job.data);
          });
          break;
        case "24H_IN_APP_NOTIFICATION":
          await handleInAppNotification(job, "REMINDER_24H");
          break;
        case "24H_EMAIL_NOTIFICATION":
          await handleEmailNotification(job, "REMINDER_24H");
          break;
        default:
          return;
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {
    logger.info({}, "[Worker - createNotificationWorker] Worker is ready");
  });
  worker.on("active", () => {
    logger.info({}, "[Worker - createNotificationWorker] Job is active");
  });

  worker.on("failed", async (job, error) => {
    if (!job) return;

    if (job.attemptsMade !== job.opts.attempts!) {
      logger.warn(
        { jobId: job.id, eventType: job.name, attemptsMade: job.attemptsMade },
        `[Worker - createNotificationWorker] Notification worker failed to process job, will retry: ${error.message}, attempts made: ${job.attemptsMade}`,
      );
      return;
    }

    switch (job.name) {
      default:
        break;
    }
  });

  worker.on("error", (error) => {
    logger.error(
      { jobId: null, eventType: null, error: error },
      "[Worker - createNotificationWorker] Notification worker error",
      error.message,
    );
  });
};
