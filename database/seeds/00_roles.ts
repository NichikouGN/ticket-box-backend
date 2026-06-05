import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("role_permissions").del();
  await knex("roles").del();

  await knex("roles").insert([
    { id: 1, name: "ORGANIZER" },
    { id: 2, name: "STAFF" },
    { id: 3, name: "AUDIENCE" },
  ]);
}
