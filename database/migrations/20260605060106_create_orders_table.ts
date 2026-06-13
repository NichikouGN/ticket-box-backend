import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  // enable UUID generator
  return knex.schema.createTable("orders", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.text("idempotency_key").notNullable().unique();

    table.integer("total_amount").notNullable();

    table
      .text("status")
      .notNullable()
      .defaultTo("PROCESSING")
      .checkIn(["PROCESSING", "COMPLETED", "FAILED", "EXPIRED"]);

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("user_id", "idx_orders_user_id");
    table.index("status", "idx_orders_status");
    table.index("created_at", "idx_orders_created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("orders");
}
