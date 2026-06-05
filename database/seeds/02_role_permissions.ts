import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("role_permissions").del();

  await knex("role_permissions").insert([
    { role_id: 1, permission_id: 1 },
    { role_id: 1, permission_id: 2 },
    { role_id: 1, permission_id: 3 },
    { role_id: 2, permission_id: 4 },
    { role_id: 2, permission_id: 5 },
  ]);
}
