import logger from "../utils/logger.js";
import { PaymentService } from "../services/payment.service.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import db from "../db/knex.js";

export const createPaymentJob = async (job: any) => {
  try {
    const { orderId, userId, amount, paymentMethod } = job.data as {
      orderId: string;
      userId: string;
      amount: number;
      paymentMethod: string;
    };

    const result = await PaymentService.createPayment({
      orderId: orderId,
      userId: userId,
      amount: amount,
      paymentMethod: paymentMethod,
    });

    await OutboxRepository.createPaymentOutboxEvent(db, "PAYMENT_CREATED", 3000, {
      orderId: orderId,
      paymentUrl: result.paymentUrl,
      paymentDeadline: result.paymentDeadline,
    });
  } catch (error) {
    throw error;
  }
};
