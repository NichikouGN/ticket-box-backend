import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("concerts").del();

  await knex("concerts").insert([
    {
      id: "1c098bed-8686-4904-8b74-3df150ff035c",
      organizer_id: "4af9187e-15dd-4160-aff4-874aec923194",
      title: "Summer Lights Music Festival 2026",
      description:
        "An unforgettable night featuring live performances from top local and international artists, immersive stage visuals, food vendors, and exclusive fan experiences.",
      venue: "Saigon Riverside Arena",
      event_date: "2026-08-20T18:00:00+07",
      cover_image: "null",
      seat_map_svg_url: "null",
      status: "PUBLISHED",
    },
  ]);
}
