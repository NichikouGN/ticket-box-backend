import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("tickets").del();

  // await knex("tickets").insert([
  //   {
  //     id: "d1111111-1111-4111-8111-111111111111",
  //     user_id: "3f2d2f6a-6c2b-4b2f-9c5a-222222222222",
  //     order_id: "b1111111-1111-4111-8111-111111111111",
  //     ticket_type_id: "a1111111-1111-4111-8111-111111111111",
  //     qr_aes256: "encrypted_qr_payload_abc",
  //     qr_sha256: "sha256_qr_hash_abc",
  //     used: false,
  //   },
  // ]);
}
