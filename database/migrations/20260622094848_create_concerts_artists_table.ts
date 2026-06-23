import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("concerts_artists", (table) => {
    table.uuid("concert_id").notNullable().references("id").inTable("concerts").onDelete("CASCADE");
    table.uuid("artist_id").notNullable().references("id").inTable("artists").onDelete("CASCADE");

    table.text("ai_bio");
    table.text("verified_bio");
    table.string("bio_status").notNullable().defaultTo("PENDING").checkIn(["PENDING", "VERIFIED", "REJECTED"]);

    table.primary(["concert_id", "artist_id"]);
    table.index(["concert_id", "artist_id"], "idx_concerts_artists_concert_id_artist_id");
    table.index("bio_status", "idx_concerts_artists_bio_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("concerts_artists");
}
