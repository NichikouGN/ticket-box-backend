import Stripe from "stripe";
import db from "../db/knex.js";
import type { Knex } from "knex";
export const StripeRepository = {
  async writePaymentIntentId(trx: Knex.Transaction, paymentId: string, paymentIntentId: string) {
    await trx("payments").where("id", paymentId).update({
      payment_intent_id: paymentIntentId,
      updated_at: db.fn.now(),
    });
  },

  async markPaymentAsSuccess(trx: Knex.Transaction, paymentId: string) {
    await trx("payments").where("id", paymentId).update({
      status: "success",
      updated_at: db.fn.now(),
    });
  },
};
