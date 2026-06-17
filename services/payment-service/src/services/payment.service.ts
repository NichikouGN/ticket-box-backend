import crypto from "crypto";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import type { CreateOrderInput } from "../types/payment.types.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();
import { StripeService } from "./stripe.service.js";

const PAYMENT_WINDOW_MINUTES = parseInt(process.env.PAYMENT_WINDOW_MINUTES || "15", 10);

const toPaymentDeadline = () =>
  new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
export const PaymentService = {
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
    try {
      const existing = await PaymentRepository.findByOrderId(input.orderId);

      if (existing) {
        logger.info(
          { paymentId: existing.id, orderId: existing.order_id },
          "[Service - createPayment] Payment already exists for order, returning existing payment info:",
          existing.order_id,
        );
        return {
          paymentUrl: existing.payment_url || "",
          paymentDeadline: existing.payment_deadline || "",
        };
      }

      const deadline = toPaymentDeadline();
      const session = await StripeService.createCheckoutSession(input, paymentId, deadline);

      if (!session || !session.paymentUrl) {
        throw new AppError("Failed to create checkout session", 500);
      }

      const payment = await PaymentRepository.createPayment(db, {
        id: paymentId,
        orderId: input.orderId,
        userId: input.userId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentSessionId: session.sessionId,
        paymentUrl: session.paymentUrl,
        paymentDeadline: deadline,
        status: "PENDING_PAYMENT",
      });

      if (!payment) {
        throw new AppError("Failed to create payment", 500);
      }

      logger.info(
        { paymentId: payment.id, orderId: payment.order_id },
        "[Service - createPayment] Payment record created successfully for order:",
        payment.order_id,
      );

      return {
        paymentUrl: session.paymentUrl,
        paymentDeadline: deadline,
      };
    } catch (error) {
      logger.error(
        { paymentId, error: error },
        "[Service - createPayment] Error during payment processing:",
      );

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Payment processing failed", 502);
    }
  },

  /**
   * Marks a payment as failed for a given order ID. If the payment is not found, it throws an AppError with a 404 status code. Otherwise, it updates the payment status to "failed", emits failure jobs for order and notification processing, and returns the updated payment details.
   * @param orderId order ID to mark as failed
   * @returns A promise resolving to the updated payment details after marking as failed
   * @throws AppError if the payment is not found or if there is an error during the update process
   */
  async markFailed(orderId: string) {
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment) {
      logger.warn({ orderId }, "[Service - markFailed] Payment not found for order:", orderId);
      return null;
    }

    await PaymentRepository.updatePaymentStatus(db, payment.id, "FAILED");
    return await PaymentRepository.findById(payment.id);
  },
};
