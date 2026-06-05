import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("ticket_types").del();

  await knex("ticket_types").insert([
    {
      id: "a1111111-1111-4111-8111-111111111111",
      concert_id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      name: "GA",
      price: 500000,
      total_quantity: 1000,
      max_per_user: 4,
      sold_quantity: 10,
      sale_start: "2026-06-01T00:00:00+07",
      sale_end: "2026-08-19T23:59:59+07",
    },
    {
      id: "a2222222-2222-4222-8222-222222222222",
      concert_id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      name: "VIP",
      price: 1500000,
      total_quantity: 200,
      max_per_user: 2,
      sold_quantity: 5,
      sale_start: "2026-06-01T00:00:00+07",
      sale_end: "2026-08-19T23:59:59+07",
    },
  ]);
}
