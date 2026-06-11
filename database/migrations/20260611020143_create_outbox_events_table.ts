import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("outbox_events", (table) => {
    table.uuid("id").primary();
    table.string("event_type").notNullable().checkIn(["CREATE_PAYMENT"]);
    table.jsonb("payload").notNullable();
    table
      .string("status")
      .notNullable()
      .defaultTo("pending")
      .checkIn(["pending", "processed", "failed"]);
    table.integer("retries").notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();

    table.index("event_type", "idx_outbox_events_event_type");
    table.index("status", "idx_outbox_events_status");
    table.index("retries", "idx_outbox_events_retries");
    table.index("updated_at", "idx_outbox_events_updated_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("outbox_events");
}
