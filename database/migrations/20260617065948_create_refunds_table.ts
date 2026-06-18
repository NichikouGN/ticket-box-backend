import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("refunds", (table) => {
    table.uuid("id").primary();
    table.uuid("payment_id").notNullable().references("id").inTable("payments").onDelete("CASCADE");
    table.string("payment_intent_id").notNullable();
    table.string("status").notNullable().checkIn(["PENDING", "FAILED", "COMPLETED"]);
    table.decimal("amount", 10, 2).notNullable().defaultTo(0.0);
    table.string("reason").notNullable().defaultTo("");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index("payment_id", "idx_refunds_payment_id");
    table.index("status", "idx_refunds_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refunds");
}
