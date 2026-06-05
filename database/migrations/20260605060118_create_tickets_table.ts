import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("tickets", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.uuid("order_id").notNullable().references("id").inTable("orders").onDelete("CASCADE");

    table
      .uuid("ticket_type_id")
      .notNullable()
      .references("id")
      .inTable("ticket_types")
      .onDelete("CASCADE");

    table.text("qr_aes256").notNullable().unique();

    table.text("qr_sha256").notNullable().unique();

    table.boolean("used").notNullable().defaultTo(false);

    table.timestamp("used_at", { useTz: true });

    table.uuid("used_by_staff").references("id").inTable("users").onDelete("SET NULL");

    table.index("user_id", "idx_tickets_user_id");
    table.index("order_id", "idx_tickets_order_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("tickets");
}
