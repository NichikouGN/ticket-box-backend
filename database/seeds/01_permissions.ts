import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("permissions").del();

  await knex("permissions").insert([
    { id: 1, code: "CREATE_CONCERT" },
    { id: 2, code: "EDIT_CONCERT" },
    { id: 3, code: "DELETE_CONCERT" },
    { id: 4, code: "SCAN_QR" },
    { id: 5, code: "MANAGE_USERS" },
  ]);
}
