import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("order_id").notNullable().references("id").inTable("orders").onDelete("CASCADE");

    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.integer("amount").notNullable();

    table.text("payment_method").notNullable();

    table
      .text("status")
      .notNullable()
      .defaultTo("PROCESSING")
      .checkIn(["PROCESSING", "PENDING_PAYMENT", "COMPLETED", "FAILED", "EXPIRED"]);

    table.string("payment_session_id").notNullable().unique();

    table.string("payment_intent_id");

    table.text("payment_url").nullable();

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("payment_deadline", { useTz: true }).notNullable();

    table.index("order_id", "idx_payments_order_id");
    table.index("user_id", "idx_payments_user_id");
    table.index("status", "idx_payments_status");
    table.index("payment_session_id", "idx_payments_payment_session_id");
    table.index("payment_intent_id", "idx_payments_payment_intent_id");
    table.index("created_at", "idx_payments_created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("payments");
}
