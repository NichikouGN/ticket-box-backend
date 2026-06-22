import { orderClient } from "../clients/order.client.js";
import db from "../db/knex.js";
import { NotificationRepository } from "../repository/notification.repository.js";
import type { NotificationPayload } from "../types/notification.types.js";

export const handleInAppNotification = async (
  job: any,
  notificationType: "ORDER_CONFIRMATION" | "REMINDER_24H",
) => {
  try {
    const { userInfo, orderId, concertData, ticketTypes } = job.data as NotificationPayload;

    const title = "Your purchase was successful";
    const message = `Your order for concert "${concertData.title}" at "${concertData.venue}" on "${concertData.event_date}" has been successfully processed. You have purchased the following tickets: ${ticketTypes.map((ticket) => `${ticket.quantity} x ${ticket.name}`).join(", ")}.`;

    const notificationIdempotency =
      notificationType === "ORDER_CONFIRMATION"
        ? `order-confirm-${orderId}`
        : `reminder-24h-${orderId}`;

    await NotificationRepository.insertNotification(
      db,
      userInfo.id,
      title,
      message,
      notificationType,
      notificationIdempotency,
    );
  } catch (error) {
    console.log("Error in handleInAppNotification:", error);
    throw error;
  }
};
