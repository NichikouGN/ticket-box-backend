import db from "../db/knex.js";
import { OrderRepository } from "../repository/order.repository.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export const handleTicketPreparation = async (orderId: string) => {
  try {
    const items = await OrderRepository.getOrderItems(db, orderId);

    return items;
  } catch (error) {
    console.log("Error in handleTicketPreparation:", error);
    throw error;
  }
};
