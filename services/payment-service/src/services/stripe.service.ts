import type { Stripe } from "stripe";
import { StripeRepository } from "../repository/stripe.repository.js";
import { orderQueue } from "../queues/order.queue.js";
import db from "../db/knex.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import { AppError } from "../types/appError.types.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import type { CheckoutSessionResponse, CreateOrderInput, PaymentRecord } from "../types/payment.types.js";
import logger from "../utils/logger.js";
import { stripe } from "../clients/stripe.client.js";

export const StripeService = {
  /**
   * Creates a Stripe checkout session for the given payment input.
   * @param input - The input data required to create a payment, including order ID, user ID, amount, payment method, and idempotency key.
   * @returns stripe checkout session URL and payment deadline
   */
  async createCheckoutSession(
    input: CreateOrderInput,
    paymentId: string,
    deadline: string,
  ): Promise<CheckoutSessionResponse> {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: `Order ${input.orderId}`,
            },
            unit_amount: input.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-cancelled`,
      metadata: {
        paymentId: paymentId,
        userId: input.userId,
        idempotencyKey: paymentId + ":charge",
      },
      expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000),
    });

    const payload = {
      sessionId: session.id,
      paymentId: paymentId,
      totalPrice: input.amount,
      paymentDeadline: deadline,
      paymentUrl: session.url || "",
    };

    return payload;
  },

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionExpired(session);
        break;
      }
      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund;
        await this.handleRefundWebhook(refund);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  },

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const metaData = session.metadata;

    const paymentId = metaData?.paymentId;
    const userId = metaData?.userId;
    const paymentStatus = session.payment_status;
    const paymentIntentId = session.payment_intent;

    if (!paymentId || !userId) {
      console.error("Missing paymentId or userId in session metadata");
      return;
    }

    // Stripe internal state
    if (paymentStatus === "paid") {
      const paymentRecord = await PaymentRepository.findById(paymentId);

      if (!paymentRecord) {
        console.error(`Payment record not found for paymentId: ${paymentId}`);
        throw new AppError("Payment record not found", 404);
      }

      if (paymentRecord.status !== "PENDING_PAYMENT") {
        this.handleLateWebhook({
          paymentId,
          paymentIntentId: paymentIntentId as string,
          amountTotal: session.amount_total as number,
        });
        return;
      }

      await db.transaction(async (trx) => {
        await StripeRepository.writePaymentIntentId(trx, paymentId, paymentIntentId as string);
        await PaymentRepository.updatePaymentStatus(trx, paymentId, "COMPLETED");
        await OutboxRepository.createPaymentOutboxEvent(
          trx,
          "PAYMENT_SUCCESS",
          {
            orderId: paymentRecord.orderId,
          },
          `order-${paymentRecord.orderId}-payment_success`,
          30,
        );
      });
    } else {
      logger.warn(
        { paymentId, userId, paymentStatus },
        `[StripeService] Received checkout.session.completed event with unexpected payment status: ${paymentStatus}`,
      );
    }
  },

  async handleLateWebhook({
    paymentIntentId,
    paymentId,
    amountTotal,
  }: {
    paymentId: string;
    paymentIntentId: string;
    amountTotal: number;
  }) {
    if (!paymentIntentId) {
      logger.error({ paymentId, amountTotal }, `[StripeService] Missing paymentIntentId for late webhook handling`);
      return;
    }

    await OutboxRepository.createPaymentOutboxEvent(
      db,
      "LATE_WEBHOOK_RECEIVED",
      {
        paymentIntentId,
        paymentId,
        amountTotal,
      },
      `order-${paymentId}-late_webhook_received`,
      30,
    );
  },

  async handleRefundWebhook(refund: Stripe.Refund) {
    const { refundId } = refund.metadata as {
      refundId: string;
    };

    const paymentRecord = await PaymentRepository.findRefundsById(refundId);

    if (!paymentRecord) {
      logger.error({ refundId }, `[StripeService] Payment record not found for refundId: ${refundId}`);
      return;
    }

    if (refund.status === "succeeded") {
      await PaymentRepository.updateRefundStatus(db, refundId, "COMPLETED", "LATE_WEBHOOK");
    } else {
      await PaymentRepository.updateRefundStatus(db, refundId, "FAILED", "STRIPE_FAILED_TO_REFUND");
    }
  },

  async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    const metaData = session.metadata;

    console.log("[Stripe] Handling checkout.session.expired event for session:", session.id, "Metadata:", metaData);

    const paymentId = metaData?.paymentId;

    if (!paymentId) {
      logger.error({ sessionId: session.id, metadata: metaData }, "[Stripe] Missing paymentId in session metadata");
      return;
    }

    const paymentRecord = await PaymentRepository.findById(paymentId);

    if (!paymentRecord) {
      logger.error(
        { sessionId: session.id, metadata: metaData, paymentId },
        `[Stripe] Payment record not found for paymentId: ${paymentId}`,
      );
      throw new AppError("Payment record not found", 404);
    }

    if (paymentRecord.status !== "PENDING_PAYMENT") {
      logger.warn(
        { sessionId: session.id, metadata: metaData, paymentId },
        `[Stripe] Payment record for paymentId: ${paymentId} has unexpected status: ${paymentRecord.status}`,
      );

      return;
    }

    logger.info(
      { sessionId: session.id, metadata: metaData, paymentId },
      `[Stripe] Handling checkout.session.expired event for paymentId: ${paymentId}`,
    );
    await db.transaction(async (trx) => {
      await PaymentRepository.updatePaymentStatus(trx, paymentId, "EXPIRED");
      await OutboxRepository.createPaymentOutboxEvent(
        trx,
        "PAYMENT_EXPIRED",
        {
          orderId: paymentRecord.orderId,
        },
        `order-${paymentRecord.orderId}-payment_expired`,
        30,
      );
    });
  },
};
