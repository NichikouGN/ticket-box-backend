import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("concerts").del();

  await knex("concerts").insert([
    {
      id: "1c098bed-8686-4904-8b74-3df150ff035c",
      organizer_id: "3f2d2f6a-6c2b-4b2f-9c5a-444444444444",
      title: "Summer Lights Music Festival 2026",
      description:
        "An unforgettable night featuring live performances from top local and international artists, immersive stage visuals, food vendors, and exclusive fan experiences.",
      venue: "Saigon Riverside Arena",
      event_date: "2026-08-20T18:00:00+07",
      cover_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQH4-hmpeoFPqvb13R_CmMHqBO90hqP7v6hPuOS-VuOu-sVm6u0tA7IMkU&s=10",
      seat_map_svg_url: "null",
      status: "PUBLISHED",
    },
  ]);
}
