import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTable("ticket_types", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("concert_id").notNullable().references("id").inTable("concerts").onDelete("CASCADE");

    table.text("name").notNullable();

    table.integer("price").notNullable();

    table.integer("total_quantity").notNullable();

    table.integer("max_per_user").notNullable().defaultTo(4);

    table.integer("sold_quantity").notNullable().defaultTo(0);

    table.timestamp("sale_start", { useTz: true });

    table.timestamp("sale_end", { useTz: true });

    table.index("concert_id", "idx_ticket_types_concert_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ticket_types");
}
