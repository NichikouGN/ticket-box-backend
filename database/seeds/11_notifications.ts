import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("notifications").del();

  // await knex("notifications").insert([
  //   {
  //     id: "12345678-1234-5678-1234-567812345678",
  //     idempotency_key: "notif_key_001",
  //     user_id: "3f2d2f6a-6c2b-4b2f-9c5a-222222222222",
  //     type: "ORDER_CONFIRM",
  //     title: "Your order is confirmed",
  //     message: "Thank you for purchasing ticket to Summer Beats 2026",
  //     status: "SENT",
  //     user_status: "UNREAD",
  //   },
  // ]);
}
