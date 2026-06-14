import { OutboxRepository } from "../repository/outbox.repository.js";
import logger from "../utils/logger.js";

export const OutboxService = {
  updateEventStatus: async (eventId: string, status: string) => {
    logger.info(
      "===================== [OrderService - Service - OutboxService - updateEventStatus] =====================",
    );
    logger.info(
      { eventId, status },
      "Updating outbox event status for eventId:",
      eventId,
      "to status:",
      status,
    );
    const result = await OutboxRepository.updateEventStatus(eventId, status);
    return !!result;
  },
};
