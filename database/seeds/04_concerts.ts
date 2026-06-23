import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("concerts").del();

  await knex("concerts").insert([
    {
      id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      organizer_id: "3f2d2f6a-6c2b-4b2f-9c5a-111111111111",
      title: "Summer Beats 2026",
      description: "A huge summer music festival in HCMC",
      // artist: "Various Artists",
      venue: "Saigon Exhibition Center",
      event_date: "2026-08-20T18:00:00+07",
      cover_image: "https://example.com/cover.jpg",
      seat_map_svg_url: "https://example.com/seat-map.svg",
      status: "PUBLISHED",
    },
  ]);
}
