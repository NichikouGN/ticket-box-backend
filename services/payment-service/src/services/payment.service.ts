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

const toPaymentDeadline = () => new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
export const PaymentService = {
  async createPayment(input: CreateOrderInput): Promise<{ paymentUrl: string; paymentDeadline: string }> {
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
      logger.error({ paymentId, error: error }, "[Service - createPayment] Error during payment processing:");

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Payment processing failed", 502);
    }
  },

  async markFailed(orderId: string) {
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment) {
      logger.warn({ orderId }, "[Service - markFailed] Payment not found for order:", orderId);
      return null;
    }

    await PaymentRepository.updatePaymentStatus(db, payment.id, "FAILED");
    return await PaymentRepository.findById(payment.id);
  },

  async getPaymentUrl(orderId: string): Promise<{ paymentUrl: string; status: string }> {
    const payment = await PaymentRepository.findByOrderId(orderId);
    if (!payment) {
      logger.warn({ orderId }, "[Service - getPaymentUrl] Payment not found for order:", orderId);
      throw new AppError("Payment not found for the given order", 404);
    }

    return {
      paymentUrl: payment.payment_url || "",
      status: payment.status,
    };
  },
};
