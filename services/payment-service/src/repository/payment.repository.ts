import type { Knex } from "knex";
import db from "../db/knex.js";
import type { PaymentRecord, PaymentStatus } from "../types/payment.types.js";
import logger from "../utils/logger.js";

export const PaymentRepository = {
  async findById(paymentId: string) {
    return db("payments").where("id", paymentId).first<PaymentRecord>();
  },

  async findByIdempotencyKey(idempotencyKey: string) {
    return db("payments").where("idempotency_key", idempotencyKey).first<PaymentRecord>();
  },

  /**
   * Creates a new payment within a transactional context.
   * @param trx Knex transaction object to ensure atomicity of payment creation and related operations. This allows for rolling back all changes if any step fails, maintaining data integrity.
   * @param input Input object containing the necessary data to create a payment, including a unique payment ID, the associated order ID, the user ID of the customer making the payment, the amount to be paid, the payment method, an idempotency key to prevent duplicate payments, and the initial status of the payment.
   * @returns A promise that resolves to the created payment record, including all relevant details such as payment ID, order ID, user ID, amount, payment method, idempotency key, status, and timestamps. If the payment creation fails, the transaction will be rolled back and an error will be thrown.
   * @throws AppError if there is an error during the payment creation process, such as database errors or validation issues. The error will contain a message and a status code that can be used to inform the client of the failure reason.
   */
  async createPayment(
    trx: Knex.Transaction,
    input: {
      id: string;
      orderId: string;
      userId: string;
      amount: number;
      paymentMethod: string;
      idempotencyKey: string;
      paymentSessionId: string;
      paymentUrl: string;
      status: PaymentStatus;
    },
  ) {
    logger.info(
      { orderId: input.orderId, userId: input.userId, idempotencyKey: input.idempotencyKey },
      "Creating payment record in database for order ID:",
      input.orderId,
    );
    const [payment] = (await trx("payments")
      .insert({
        id: input.id,
        order_id: input.orderId,
        user_id: input.userId,
        amount: input.amount,
        payment_method: input.paymentMethod,
        idempotency_key: input.idempotencyKey,
        payment_session_id: input.paymentSessionId,
        payment_url: input.paymentUrl,
        status: input.status,
      })
      .returning("*")) as PaymentRecord[];

    return payment;
  },

  async updatePaymentIntentRetries(intentId: string) {
    logger.info({ intentId }, "Updating payment intent retries for intent ID:", intentId);
    await db("outbox_events")
      .where("id", intentId)
      .increment("retries", 1)
      .update({ next_retry_at: db.raw("NOW() + INTERVAL '30 seconds'") });
  },

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    logger.info(
      { paymentId, status },
      "Updating payment status for payment ID:",
      paymentId,
      "to status:",
      status,
    );
    await db("payments").where("id", paymentId).update({
      status,
      updated_at: db.fn.now(),
    });
  },
};
