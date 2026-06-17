import logger from "../utils/logger.js";
import { redis } from "../clients/redis.client.js";
import { OrderRepository } from "../repository/order.repository.js";
import db from "../db/knex.js";

export const handleCreatePaymentFailure = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    await OrderRepository.updateOrderStatus(db, orderId, "FAILED");

    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "order_updates",
      JSON.stringify({
        orderId: orderId,
        status: "PAYMENT_FAILED",
        paymentUrl: null,
        paymentDeadline: null,
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    throw error;
  }
};
