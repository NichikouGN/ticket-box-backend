import { stripe } from "../clients/stripe.client.js";
import db from "../db/knex.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import logger from "../utils/logger.js";
export const handlePaymentRefund = async (job: any) => {
  const { paymentIntentId, paymentId, amountTotal } = job.data as {
    paymentIntentId: string;
    paymentId: string;
    amountTotal: number;
  };

  const refundId = crypto.randomUUID();
  try {
    await PaymentRepository.addRefundRecord(db, refundId, paymentIntentId, paymentId, amountTotal);

    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      metadata: {
        refundId: refundId,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const existingRefund = await PaymentRepository.findRefundsById(refundId);

      if (!existingRefund) {
        throw new Error(`Refund record not found for refundId: ${refundId}`);
      }

      await PaymentRepository.updateRefundStatus(db, existingRefund.id, "FAILED", error.message);
    }
  }
};
