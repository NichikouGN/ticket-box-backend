import db from "../db/knex.js";
import { NotificationRepository } from "../repository/notification.repository.js";
import type { NotificationPayload } from "../types/notification.types.js";

export const handleSet24hReminder = async (job: any) => {
  try {
    const { userInfo, orderId, concertData, ticketTypes } = job.data as NotificationPayload;

    const eventTime = new Date(concertData.eventDate).getTime();
    const scheduledTime = new Date(eventTime - 24 * 60 * 60 * 1000); // 24 hours before the event

    await NotificationRepository.setReminder(db, userInfo.id, scheduledTime, {
      userInfo,
      orderId,
      concertData,
      ticketTypes,
    });
  } catch (error) {
    console.error("Error in handleSet24hReminder:", error);
    throw error;
  }
};
