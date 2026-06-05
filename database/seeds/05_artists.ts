import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("artists").del();

  await knex("artists").insert([
    {
      id: "9b1c2d3e-4f5a-4b6c-8d9e-000000000011",
      concert_id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      name: "DJ Alpha",
      bio: "International DJ known for EDM sets",
      bio_draft: null,
      bio_status: "published",
    },
    {
      id: "9b1c2d3e-4f5a-4b6c-8d9e-000000000012",
      concert_id: "8a1b2c3d-4e5f-4a6b-8c9d-000000000001",
      name: "Singer Beta",
      bio: null,
      bio_draft: "Rising pop artist from Vietnam",
      bio_status: "pending_review",
    },
  ]);
}
