import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("payments").del();

  await knex("payments").insert([
    {
      id: "c1111111-1111-4111-8111-111111111111",
      order_id: "b1111111-1111-4111-8111-111111111111",
      user_id: "3f2d2f6a-6c2b-4b2f-9c5a-222222222222",
      amount: 500000,
      payment_method: "momo",
      idempotency_key: "payment_key_123",
      status: "success",
      payment_ref: "MOMO_TXN_ABC_001",
    },
  ]);
}
