import { OrderService } from "../services/order.service.js";
import { OrderRepository } from "../repository/order.repository.js";
import type { CreateOrderItemInput } from "../types/order.types.js";

/**
 * Handles the expiration of an order.
 * @param orderId The ID of the order to expire.
 * @returns A promise resolving to an object indicating whether the order was ignored.
 */
export const handleExpiredOrder = async (orderId: string) => {
  const order = await OrderRepository.findById(orderId);
  if (!order || order.status !== "pending") {
    return { ignored: true };
  }

  const items = await OrderRepository.findOrderItems(orderId);
  await OrderRepository.updateStatus(orderId, "expired");

  const redisItems = items.map((item) => ({
    concertId: item.concertId,
    ticketTypeId: item.ticketTypeId,
    quantity: item.quantity,
    price: 0,
    maxPerUser: 0,
  })) as CreateOrderItemInput[];

  await OrderService.rollbackStocks(order.userId, items[0]?.concertId ?? "", redisItems);

  return { ignored: false };
};
