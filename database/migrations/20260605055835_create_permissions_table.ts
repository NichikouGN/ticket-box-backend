import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permissions", (table) => {
    table.increments("id").primary(); // SERIAL

    table.string("code", 100).notNullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("permissions");
}
