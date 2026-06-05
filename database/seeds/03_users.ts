import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("users").del();

  await knex("users").insert([
    {
      id: "3f2d2f6a-6c2b-4b2f-9c5a-111111111111",
      email: "organizer@example.com",
      password_hash: "hashed_pw_1",
      full_name: "Nguyen Organizer",
      role: "ORGANIZER",
      status: "ACTIVE",
    },
    {
      id: "3f2d2f6a-6c2b-4b2f-9c5a-222222222222",
      email: "audience@example.com",
      password_hash: "hashed_pw_2",
      full_name: "Tran Audience",
      role: "AUDIENCE",
      status: "ACTIVE",
    },
    {
      id: "3f2d2f6a-6c2b-4b2f-9c5a-333333333333",
      email: "staff@example.com",
      password_hash: "hashed_pw_3",
      full_name: "Le Staff",
      role: "STAFF",
      status: "ACTIVE",
    },
  ]);
}
