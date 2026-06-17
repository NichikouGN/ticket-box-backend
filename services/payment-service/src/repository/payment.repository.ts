import type { Knex } from "knex";
import db from "../db/knex.js";
import type { PaymentRecord, PaymentStatus } from "../types/payment.types.js";
import logger from "../utils/logger.js";
type DB = Knex | Knex.Transaction;

export const PaymentRepository = {
  async findById(paymentId: string) {
    return db("payments").where("id", paymentId).first<PaymentRecord>();
  },

  async findByOrderId(orderId: string) {
    return db("payments").where("order_id", orderId).first<PaymentRecord>();
  },

  /**
   * Creates a new payment within a transactional context.
   * @param db Knex database object to ensure atomicity of payment creation and related operations. This allows for rolling back all changes if any step fails, maintaining data integrity.
   * @param input Input object containing the necessary data to create a payment, including a unique payment ID, the associated order ID, the user ID of the customer making the payment, the amount to be paid, the payment method, an idempotency key to prevent duplicate payments, and the initial status of the payment.
   * @returns A promise that resolves to the created payment record, including all relevant details such as payment ID, order ID, user ID, amount, payment method, idempotency key, status, and timestamps. If the payment creation fails, the transaction will be rolled back and an error will be thrown.
   * @throws AppError if there is an error during the payment creation process, such as database errors or validation issues. The error will contain a message and a status code that can be used to inform the client of the failure reason.
   */
  async createPayment(
    db: DB,
    input: {
      id: string;
      orderId: string;
      userId: string;
      amount: number;
      paymentMethod: string;
      paymentSessionId: string;
      paymentUrl: string;
      status: PaymentStatus;
      paymentDeadline: string;
    },
  ) {
    logger.info(
      { orderId: input.orderId, userId: input.userId },
      "[Repository - createPayment] Creating payment record in database for order ID:",
      input.orderId,
    );
    const [payment] = (await db("payments")
      .insert({
        id: input.id,
        order_id: input.orderId,
        user_id: input.userId,
        amount: input.amount,
        payment_method: input.paymentMethod,
        payment_session_id: input.paymentSessionId,
        payment_url: input.paymentUrl,
        status: input.status,
        payment_deadline: input.paymentDeadline,
      })
      .returning("*")) as PaymentRecord[];

    return payment;
  },

  async updatePaymentStatus(db: DB, paymentId: string, status: PaymentStatus) {
    logger.info(
      { paymentId, status },
      "[Repository - updatePaymentStatus] Updating payment status for payment ID:",
      paymentId,
      "to status:",
      status,
    );
    await db("payments").where("id", paymentId).update({
      status,
      updated_at: db.fn.now(),
    });
  },

  async findRefundsById(refundId: string) {
    return db("refunds").where("id", refundId).first();
  },

  async addRefundRecord(
    db: DB,
    refundId: string,
    paymentIntentId: string,
    paymentId: string,
    amountTotal: number,
  ) {
    logger.info(
      { paymentIntentId, refundId, amountTotal },
      "[Repository - addRefundRecord] Adding refund record for payment intent ID:",
      paymentIntentId,
    );

    await db("refunds").insert({
      id: refundId,
      payment_id: paymentId,
      payment_intent_id: paymentIntentId,
      amount: amountTotal,
      status: "PENDING",
      reason: "LATE_WEBHOOK",
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  },

  async updateRefundStatus(db: DB, refundId: string, status: string, reason: string) {
    logger.info(
      { refundId, reason },
      "[Repository - updateRefundStatus] Updating refund record for refund ID:",
      refundId,
      "with status:",
      status,
      "and reason:",
      reason,
    );

    return await db("refunds").where("id", refundId).update({
      status: status,
      reason: reason,
      updated_at: db.fn.now(),
    });
  },
};
