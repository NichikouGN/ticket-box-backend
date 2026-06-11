import crypto from "crypto";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import type {
  CreateOrderInput,
  CreatePaymentInput,
  OrderResponse,
  PaymentDetailResponse,
  PaymentRecord,
  CheckoutSessionResponse,
} from "../types/payment.types.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import { notificationQueue } from "../queues/notification.queue.js";
import { orderQueue } from "../queues/order.queue.js";
import { ticketQueue } from "../queues/ticket.queue.js";
import { stripe } from "../infrastructure/stripe.client.js";
import dotenv from "dotenv";
dotenv.config();

const PAYMENT_WINDOW_MINUTES = 10;

const toPaymentDeadline = () =>
  new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();

/**
 * Emits success jobs for a completed payment.
 * @param payment The payment record.
 * @param paymentRef The payment reference.
 * @return A promise that resolves when all jobs have been emitted.
 */
const emitSuccessJobs = async (payment: PaymentRecord, paymentRef: string) => {
  await orderQueue.add(
    "UPDATE_ORDER_PAID",
    {
      order_id: payment.order_id,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
      payment_ref: paymentRef,
    },
    {
      jobId: `order-paid-${payment.order_id}`,
    },
  );

  await ticketQueue.add(
    "GENERATE_TICKETS",
    {
      order_id: payment.order_id,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
      payment_ref: paymentRef,
    },
    {
      jobId: `tickets-${payment.order_id}`,
    },
  );

  await notificationQueue.add(
    "SEND_ORDER_CONFIRMED",
    {
      order_id: payment.order_id,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
      payment_ref: paymentRef,
    },
    {
      jobId: `order-confirmed-${payment.order_id}`,
    },
  );
};

/**
 * Marks a payment as failed for a given payment ID. If the payment is not found, it throws an AppError with a 404 status code. Otherwise, it updates the payment status to "failed", emits failure jobs for order and notification processing, and returns the updated payment details.
 * @param payment The payment record
 * @return A promise that resolves when all failure jobs have been emitted
 */
const emitFailureJobs = async (payment: PaymentRecord) => {
  await orderQueue.add(
    "UPDATE_ORDER_FAILED",
    {
      order_id: payment.order_id,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
    },
    {
      jobId: `order-failed-${payment.order_id}`,
    },
  );

  await notificationQueue.add(
    "SEND_ORDER_FAILED",
    {
      order_id: payment.order_id,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
    },
    {
      jobId: `order-failed-notification-${payment.order_id}`,
    },
  );
};

export const PaymentService = {
  /**
   * Creates a Stripe checkout session for the given payment input.
   * @param input - The input data required to create a payment, including order ID, user ID, amount, payment method, and idempotency key.
   * @returns stripe checkout session URL and payment deadline
   */
  async createCheckoutSession(
    input: CreateOrderInput,
    paymentId: string,
  ): Promise<CheckoutSessionResponse> {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Order ${input.orderId} Payment`,
            },
            unit_amount: input.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:4000/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:4000/payment-cancelled`,
      metadata: {
        paymentId: paymentId,
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
      },
    });

    const payload = {
      sessionId: session.id,
      paymentId: paymentId,
      totalPrice: input.amount,
      paymentDeadline: toPaymentDeadline(),
      paymentUrl: session.url || "",
    };

    return payload;
  },

  /**
   * Creates a payment record and initiates the payment process for the given input. If a payment with the same idempotency key already exists, it returns the existing payment information. Otherwise, it creates a new payment record, generates a checkout session, and returns the payment details including the checkout URL and payment deadline.
   * @param input  - The input data required to create a payment, including order ID, user ID, amount, payment method, and idempotency key.
   * @returns A promise resolving to the payment details including the checkout URL and payment deadline.
   * @throws AppError if there is an error during payment creation or processing.
   */
  async createPayment(
    input: CreateOrderInput,
  ): Promise<{ paymentUrl: string; paymentDeadline: string }> {
    const paymentId = crypto.randomUUID();

    console.log(
      "[Step 11]: Starting payment creation process for order:",
      input.orderId,
      "with payment ID:",
      paymentId,
    );
    const payment = await db.transaction(async (trx) => {
      return await PaymentRepository.createPayment(trx, {
        id: paymentId,
        orderId: input.orderId,
        userId: input.userId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        idempotencyKey: input.idempotencyKey,
        status: "pending",
      });
    });

    console.log("Created payment record:", payment);

    if (!payment) {
      throw new AppError("Failed to create payment", 500);
    }

    try {
      console.log("[Step 12] Creating checkout session for payment ID:", payment.id);
      const result = await this.createCheckoutSession(input, paymentId);
      if (!result || !result.paymentUrl) {
        throw new AppError("Failed to create checkout session", 500);
      }

      console.log(
        "[Step 13] Checkout session created successfully for payment ID:",
        payment.id,
        "Session URL:",
        result.paymentUrl,
      );

      await PaymentRepository.updateSessionId(payment.id, result.sessionId);

      return {
        paymentUrl: result.paymentUrl,
        paymentDeadline: toPaymentDeadline(),
      };
    } catch (error) {
      console.error("Error during payment processing:", error);

      await PaymentRepository.updateStatus(payment.id, "failed");
      await emitFailureJobs(payment);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Payment processing failed", 502);
    }
  },

  /**
   * Gets the payment details for a given payment ID. If the payment is not found, it throws an AppError with a 404 status code. Otherwise, it returns the payment details including payment ID, order ID, status, amount, payment reference, and processed timestamp.
   * @param paymentId - The ID of the payment to retrieve details for.
   * @returns A promise resolving to the payment details.
   * @throws AppError if the payment is not found or if there is an error during retrieval.
   */
  async getPayment(paymentId: string): Promise<PaymentDetailResponse> {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    return {
      paymentId: payment.id,
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      paymentSessionId: payment.payment_session_id,
      processedAt: payment.updated_at,
    };
  },

  /**
   * Marks a payment as failed for a given payment ID. If the payment is not found, it throws an AppError with a 404 status code. Otherwise, it updates the payment status to "failed", emits failure jobs for order and notification processing, and returns the updated payment details.
   * @param paymentId payment ID to mark as failed
   * @returns A promise resolving to the updated payment details after marking as failed
   * @throws AppError if the payment is not found or if there is an error during the update process
   */
  async markFailed(paymentId: string) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    await PaymentRepository.updateStatus(payment.id, "failed", payment.payment_session_id);
    await emitFailureJobs(payment);

    return this.getPayment(paymentId);
  },
};
