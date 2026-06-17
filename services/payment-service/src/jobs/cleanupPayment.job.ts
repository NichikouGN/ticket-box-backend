import db from "../db/knex.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import logger from "../utils/logger.js";

export const cleanupPaymentJob = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    const paymentRecord = await PaymentRepository.findByOrderId(orderId);

    if (!paymentRecord) {
      return;
    }

    if (paymentRecord.status === "PENDING_PAYMENT") {
      await PaymentRepository.updatePaymentStatus(db, paymentRecord.id, "EXPIRED");
    }
  } catch (error) {
    throw error;
  }
};
