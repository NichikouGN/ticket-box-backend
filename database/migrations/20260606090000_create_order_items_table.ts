import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTable("order_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("order_id").notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table
      .uuid("concert_id")
      .notNullable()
      .references("id")
      .inTable("concerts")
      .onDelete("RESTRICT");
    table
      .uuid("ticket_type_id")
      .notNullable()
      .references("id")
      .inTable("ticket_types")
      .onDelete("RESTRICT");

    table.integer("quantity").notNullable();
    table.integer("unit_price").notNullable();
    table.integer("line_total").notNullable();

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("order_id", "idx_order_items_order_id");
    table.index("concert_id", "idx_order_items_concert_id");
    table.index("ticket_type_id", "idx_order_items_ticket_type_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("order_items");
}
