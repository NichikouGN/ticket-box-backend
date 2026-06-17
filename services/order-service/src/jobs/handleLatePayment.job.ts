import db from "../db/knex.js";
import { OrderRepository } from "../repository/order.repository.js";
import { redis } from "../clients/redis.client.js";

export const handleLatePayment = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    await OrderRepository.updateOrderStatus(db, orderId, "EXPIRED");

    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "order_updates",
      JSON.stringify({
        orderId: orderId,
        status: "EXPIRED",
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    throw error;
  }
};
