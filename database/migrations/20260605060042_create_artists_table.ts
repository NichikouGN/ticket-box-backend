import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("artists", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("concert_id").notNullable().references("id").inTable("concerts").onDelete("CASCADE");

    table.text("name").notNullable();

    table.text("bio"); // official published bio

    table.text("bio_draft"); // AI-generated / draft version

    table
      .text("bio_status")
      .notNullable()
      .defaultTo("none")
      .checkIn(["none", "pending_review", "published"]);

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("concert_id", "idx_artists_concert_id");
    table.index("bio_status", "idx_artists_bio_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("artists");
}
