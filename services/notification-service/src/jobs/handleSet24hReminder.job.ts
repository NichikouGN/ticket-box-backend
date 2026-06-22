import db from "../db/knex.js";
import { NotificationRepository } from "../repository/notification.repository.js";
import type { NotificationPayload } from "../types/notification.types.js";

export const handleSet24hReminder = async (job: any) => {
  try {
    const { userInfo, orderId, concertData, ticketTypes } = job.data as NotificationPayload;

    // const title = "Reminder: Your concert is in 24 hours!";
    // const message = `This is a friendly reminder that your concert "${concertData.title}" at "${concertData.venue}" is happening on "${concertData.event_date}". You have purchased the following tickets: ${ticketTypes.map((ticket) => `${ticket.quantity} x ${ticket.name}`).join(", ")}. Please make sure to arrive on time and enjoy the show!`;

    await NotificationRepository.setReminder(db, userInfo.id, concertData.event_date, {
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
