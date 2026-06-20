import db from "../db/knex.js";
import { OrderRepository } from "../repository/order.repository.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export const handleTicketPreparation = async (orderId: string) => {
  try {
    const items = await OrderRepository.getOrderItems(db, orderId);
    const userIds = new Set<string>(items.map((item) => item.userId));

    if (userIds.size > 1) {
      throw new Error("Order items belong to different users.");
    }

    await OutboxRepository.createOrderOutboxEvent(db, "GENERATE_TICKETS", {
      items: items,
      orderId: orderId,
    });
  } catch (error) {
    console.log("Error in handleTicketPreparation:", error);
    throw error;
  }
};
