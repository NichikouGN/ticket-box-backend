import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("email").notNullable().unique();

    table.text("password_hash").notNullable();

    table.string("full_name").notNullable();

    table.string("role").notNullable().checkIn(["AUDIENCE", "ORGANIZER", "STAFF"]);

    table
      .string("status")
      .notNullable()
      .defaultTo("ACTIVE")
      .checkIn(["ACTIVE", "BANNED", "DELETED"]);

    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index("role", "idx_users_role");
    table.index("status", "idx_users_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
