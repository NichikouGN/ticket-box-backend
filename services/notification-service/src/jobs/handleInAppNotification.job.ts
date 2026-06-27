import { DatabaseError } from "pg";
import { orderClient } from "../clients/order.client.js";
import { redis } from "../clients/redis.client.js";
import db from "../db/knex.js";
import { NotificationRepository } from "../repository/notification.repository.js";
import type { NotificationPayload } from "../types/notification.types.js";
import { UnrecoverableError } from "bullmq";

export const handleInAppNotification = async (job: any, notificationType: "ORDER_CONFIRMATION" | "REMINDER_24H") => {
  try {
    const { userInfo, orderId, concertData, ticketTypes } = job.data as NotificationPayload;

    const title = "Your purchase was successful";
    const message = `Your order for concert "${concertData.title}" at "${concertData.venue}" on "${concertData.eventDate}" has been successfully processed. You have purchased the following tickets: ${ticketTypes.map((ticket) => `${ticket.quantity} x ${ticket.name}`).join(", ")}.`;

    const notificationIdempotency =
      notificationType === "ORDER_CONFIRMATION" ? `order-confirm-${orderId}` : `reminder-24h-${orderId}`;

    const notificationId = crypto.randomUUID();
    const createdAt = new Date();

    await NotificationRepository.insertNotification(
      db,
      notificationId,
      userInfo.id,
      title,
      message,
      notificationType,
      notificationIdempotency,
      createdAt,
    );

    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "notification_updates",
      JSON.stringify({
        userId: userInfo.id,
        payload: {
          id: notificationId,
          type: notificationType,
          title: title,
          message: message,
          userStatus: "UNREAD",
          createdAt: createdAt,
        },
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        console.log("Duplicate notification detected, skipping insertion.");
        throw new UnrecoverableError("Duplicate notification detected, skipping insertion.");
      }
    }
    console.log("Error in handleInAppNotification:", typeof error);
    throw error;
  }
};
