import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("checkin_logs").del();

  //   await knex("checkin_logs").insert([
  //     {
  //       id: "44444444-4444-4444-4444-444444444444",
  //       ticket_id: "d1111111-1111-4111-8111-111111111111",
  //       staff_id: "3f2d2f6a-6c2b-4b2f-9c5a-333333333333",
  //       result: "success",
  //     },
  //   ]);
}
