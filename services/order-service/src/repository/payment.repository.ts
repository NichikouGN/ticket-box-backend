import db from "../db/knex.js";

export const PaymentRepository = {
  async getOrderUrl(orderId: string): Promise<{ paymentUrl: string; status: string } | null> {
    const result = await db("payments")
      .select("payment_url", "status")
      .where("order_id", orderId)
      .first();

    if (!result) {
      return null;
    }

    return {
      paymentUrl: result.payment_url,
      status: result.status,
    };
  },
};
