import type { Stripe } from "stripe";
import { StripeRepository } from "../repository/stripe.repository.js";
import { orderQueue } from "../queues/order.queue.js";
import db from "../db/knex.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import { AppError } from "../types/appError.types.js";

export const StripeService = {
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      //   case "checkout.session.expired":
      //     const expiredSession = event.data.object as Stripe.Checkout.Session;
      //     await this.handleCheckoutSessionExpired(expiredSession);
      //     break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  },

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const metaData = session.metadata;

    console.log(
      "[Stripe Step 1] Handling checkout.session.completed event for session:",
      session.id,
      "Metadata:",
      metaData,
    );

    const paymentId = metaData?.paymentId;
    const userId = metaData?.userId;
    const paymentStatus = session.payment_status;
    const paymentIntentId = session.payment_intent;

    if (!paymentId || !userId) {
      console.error("Missing paymentId or userId in session metadata");
      return;
    }

    if (paymentStatus === "paid") {
      console.log(
        "[Stripe Step 2] Performing db transaction to update payment record for paymentId:",
        paymentId,
        "with paymentIntentId:",
        paymentIntentId,
      );

      await db.transaction(async (trx) => {
        await StripeRepository.writePaymentIntentId(trx, paymentId, paymentIntentId as string);
        await StripeRepository.markPaymentAsSuccess(trx, paymentId);
      });
      const paymentRecord = await PaymentRepository.findById(paymentId);

      if (!paymentRecord) {
        console.error(`Payment record not found for paymentId: ${paymentId}`);
        throw new AppError("Payment record not found", 404);
      }

      const payload = {
        paymentId: paymentRecord?.id,
        orderId: paymentRecord?.order_id,
        userId: paymentRecord?.user_id,
        amount: paymentRecord?.amount,
        paymentRef: paymentRecord?.payment_session_id,
        paymentMethod: paymentRecord?.payment_method,
        idempotencyKey: paymentRecord?.idempotency_key,
        status: "success",
      };
      orderQueue.add("UPDATE_ORDER_PAID", payload, { removeOnComplete: true });
    } else {
      console.warn(`Payment ${paymentId} has unexpected status: ${paymentStatus}`);
    }
  },

  //   async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  //     const paymentId = session.metadata?.paymentId;
  //     const userId = session.metadata?.userId;
  //     const amount = session.amount_total ? session.amount_total / 100 : 0;

  //     if (!paymentId || !userId) {
  //       console.error("Missing paymentId or userId in session metadata");
  //       return;
  //     }

  //     const payment = {
  //       order_id: paymentId,
  //       user_id: userId,
  //       amount,
  //     };
  //     console.log(
  //       `Handling checkout session expired event for paymentId: ${paymentId}, userId: ${userId}`,
  //     );
  //   },
};
