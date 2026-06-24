import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("ticket_types").del();

  await knex("ticket_types").insert([
    {
      id: "2ff664ec-6760-4df9-adcf-2d022c36770e",
      concert_id: "1c098bed-8686-4904-8b74-3df150ff035c",
      name: "GA",
      price: 500000,
      total_quantity: 2000,
      max_per_user: 4,
      sold_quantity: 0,
      sale_start: "2026-06-01T00:00:00+07",
      sale_end: "2026-08-19T23:59:59+07",
    },
    {
      id: "b27c2a3b-9ea5-4ec0-8666-439026f7e2e5",
      concert_id: "1c098bed-8686-4904-8b74-3df150ff035c",
      name: "VIP",
      price: 1500000,
      total_quantity: 500,
      max_per_user: 2,
      sold_quantity: 0,
      sale_start: "2026-06-01T00:00:00+07",
      sale_end: "2026-08-19T23:59:59+07",
    },
    {
      id: "eabe7288-f1a3-4334-b5a7-1141c878a63b",
      concert_id: "1c098bed-8686-4904-8b74-3df150ff035c",
      name: "GRAND",
      price: 5000000,
      total_quantity: 100,
      max_per_user: 1,
      sold_quantity: 0,
      sale_start: "2026-06-01T00:00:00+07",
      sale_end: "2026-08-19T23:59:59+07",
    },
  ]);
}
