import { OrderRepository } from "../repository/order.repository.js";
import db from "../db/knex.js";
import { redis } from "../clients/redis.client.js";

export const handlePaymentSuccessJob = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    await OrderRepository.updateOrderStatus(db, orderId, "COMPLETED");

    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "order_updates",
      JSON.stringify({
        orderId: orderId,
        status: "COMPLETED",
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    throw error;
  }
};
