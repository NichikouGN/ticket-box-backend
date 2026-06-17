import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("orders").del();

  // await knex("orders").insert([
  //   {
  //     id: "b1111111-1111-4111-8111-111111111111",
  //     user_id: "3f2d2f6a-6c2b-4b2f-9c5a-222222222222",
  //     idempotency_key: "order_key_123",
  //     total_amount: 500000,
  //     status: "COMPLETED",
  //   },
  // ]);
}
