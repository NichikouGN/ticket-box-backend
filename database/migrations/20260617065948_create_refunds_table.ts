import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("refunds", (table) => {
    table.uuid("id").primary();
    table.uuid("payment_id").notNullable();
    table.string("payment_intent_id").notNullable();
    table.string("status").notNullable().checkIn(["PENDING", "FAILED", "COMPLETED"]);
    table.string("amount").notNullable();
    table.text("reason");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index("payment_id", "idx_refunds_payment_id");
    table.index("status", "idx_refunds_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refunds");
}
