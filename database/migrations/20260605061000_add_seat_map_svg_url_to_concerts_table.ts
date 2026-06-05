import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("concerts", (table) => {
    table.text("seat_map_svg_url");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("concerts", (table) => {
    table.dropColumn("seat_map_svg_url");
  });
}
