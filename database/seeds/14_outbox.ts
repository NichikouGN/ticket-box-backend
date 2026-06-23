import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("notifications_outbox").del();
  await knex("orders_outbox").del();
  await knex("payments_outbox").del();
  await knex("concerts_outbox").del();
}
