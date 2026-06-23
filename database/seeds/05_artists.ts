import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("artists").del();

  await knex("artists").insert([
    {
      id: "9b1c2d3e-4f5a-4b6c-8d9e-000000000011",
      name: "DJ Alpha",
    },
    {
      id: "9b1c2d3e-4f5a-4b6c-8d9e-000000000012",
      name: "Singer Beta",
    },
  ]);
}
