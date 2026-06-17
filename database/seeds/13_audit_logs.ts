import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("audit_logs").del();

  //   await knex("audit_logs").insert([
  //     {
  //       id: "55555555-5555-5555-5555-555555555555",
  //       actor_id: "3f2d2f6a-6c2b-4b2f-9c5a-333333333333",
  //       action: "SCAN_QR",
  //       target_type: "ticket",
  //       target_id: "d1111111-1111-4111-8111-111111111111",
  //       reason: "Valid entry at gate A",
  //     },
  //   ]);
}
