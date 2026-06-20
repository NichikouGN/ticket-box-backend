import { OrderRepository } from "../repository/order.repository.js";
import db from "../db/knex.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export const cleanupOrderJob = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    const orderRecord = await OrderRepository.findById(db, orderId);
    if (!orderRecord) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (orderRecord.status === "PROCESSING") {
      logger.info(
        { jobId: job.data.id, eventType: job.name, orderId: orderId },
        "Order is processing when cleanup job was triggered, cleaning up expired order:",
        orderId,
      );

      await db.transaction(async (trx) => {
        await OrderRepository.updateOrderStatus(trx, orderRecord.id, "EXPIRED");
        await OutboxRepository.createOrderOutboxEvent(trx, "CLEANUP_EXPIRED_PAYMENT", {
          orderId: orderRecord.id,
        });
      });
      logger.info(
        { jobId: job.data.id, eventType: job.name, orderId: orderId },
        "Successfully cleaned up expired order:",
        orderId,
      );
    }
  } catch (error) {
    logger.error(
      { jobId: job.data.id, eventType: job.name, orderId: orderId, error: error },
      "Failed to clean up expired order:",
      orderId,
    );
    throw error;
  }
};
