import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("vip_guests", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("concert_id").notNullable().references("id").inTable("concerts").onDelete("CASCADE");

    table.text("full_name").notNullable();

    table.text("email").notNullable();

    table.text("sponsor").notNullable();

    table.text("ticket_type").notNullable().checkIn(["GA", "VIP", "SVIP", "CAT1", "CAT2"]);

    table.uuid("ticket_id").nullable().references("id").inTable("tickets").onDelete("SET NULL");

    table.timestamp("imported_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    // unique constraint: prevent duplicate VIP entries per concert
    table.unique(["concert_id", "email"], "uq_vip_guests_concert_email");

    table.index("concert_id", "idx_vip_guests_concert_id");
    table.index("email", "idx_vip_guests_email");
    table.index("ticket_id", "idx_vip_guests_ticket_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("vip_guests");
}
