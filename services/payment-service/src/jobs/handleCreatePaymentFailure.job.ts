import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import db from "../db/knex.js";

export const handleCreatePaymentFailureJob = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    await PaymentRepository.updatePaymentStatus(db, orderId, "FAILED");
    await OutboxRepository.createPaymentOutboxEvent(
      db,
      "CREATE_PAYMENT_FAILED",
      {
        orderId: orderId,
      },
      `order-${orderId}-create_payment_failed`,
      30,
    );
  } catch (err) {
    logger.error(
      { jobId: job.data.id, eventType: job.name, orderId: orderId, error: err },
      "Failed to update outbox event status to FAILED for order:",
      orderId,
    );
    throw err;
  }
};
