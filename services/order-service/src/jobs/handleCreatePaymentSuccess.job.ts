import logger from "../utils/logger.js";
import { redis } from "../clients/redis.client.js";

export const handleCreatePaymentSuccess = async (job: any) => {
  const { orderId, paymentUrl, paymentDeadline } = job.data as {
    orderId: string;
    paymentUrl: string;
    paymentDeadline: string;
  };

  try {
    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "payment_url_updates",
      JSON.stringify({
        orderId: orderId,
        status: "PENDING_PAYMENT",
        paymentUrl: paymentUrl,
        paymentDeadline: paymentDeadline,
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    logger.error(
      { jobId: job.data.id, eventType: job.name, orderId: orderId, error: error },
      "[Job - handleCreatePaymentSuccess] Failed to publish payment URL update for order:",
      orderId,
    );
    throw error;
  }
};
