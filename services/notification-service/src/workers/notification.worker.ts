import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import db from "../db/knex.js";
import { handleInAppNotification } from "../jobs/handleInAppNotification.job.js";
import { handleEmailNotification } from "../jobs/handleEmailNotification.job.js";
import { handleSet24hReminder } from "../jobs/handleSet24hReminder.job.js";
import type { NotificationPayload } from "../types/notification.types.js";

export const createNotificationWorker = async () => {
  const worker = new Worker(
    "notification-queue",
    async (job) => {
      const jobData = job.data as NotificationPayload;

      switch (job.name) {
        case "NOTIFY_USER":
          db.transaction(async (trx) => {
            await OutboxRepository.createNotificationOutboxEvent(
              trx,
              "IN_APP_NOTIFICATION",
              jobData,
              `order-${jobData.orderId}-in_app`,
              30,
            );
            await OutboxRepository.createNotificationOutboxEvent(
              trx,
              "EMAIL_NOTIFICATION",
              jobData,
              `order-${jobData.orderId}-email`,
              60,
            );
            await OutboxRepository.createNotificationOutboxEvent(
              trx,
              "SET_24H_REMINDER",
              jobData,
              `order-${jobData.orderId}-24h`,
              90,
            );
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
            await OutboxRepository.createNotificationOutboxEvent(
              trx,
              "24H_IN_APP_NOTIFICATION",
              job.data,
              `reminder_24h-${jobData.orderId}-in_app`,
              30,
            );
            await OutboxRepository.createNotificationOutboxEvent(
              trx,
              "24H_EMAIL_NOTIFICATION",
              job.data,
              `reminder_24h-${jobData.orderId}-email`,
              60,
            );
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
