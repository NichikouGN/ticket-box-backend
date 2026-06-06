import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTable("concerts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("organizer_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.text("title").notNullable();

    table.text("description");

    table.text("artist").notNullable();

    table.text("venue").notNullable();

    table.timestamp("event_date", { useTz: true }).notNullable();

    table.text("cover_image");

    table
      .text("status")
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "cancelled"]);

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("organizer_id", "idx_concerts_organizer_id");
    table.index("event_date", "idx_concerts_event_date");
    table.index("status", "idx_concerts_status");
    table.index("title", "idx_concerts_title");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("concerts");
}
