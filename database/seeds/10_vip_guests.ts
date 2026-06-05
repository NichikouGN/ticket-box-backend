import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("vip_guests").del();

  await knex("vip_guests").insert([
    {
      id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      concert_id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      full_name: "VIP Guest One",
      email: "vip1@example.com",
      sponsor: "Brand A",
      ticket_type: "VIP",
      ticket_id: null,
    },
  ]);
}
