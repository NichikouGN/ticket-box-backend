import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await knex.schema.createTable("notifications_reminders", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.jsonb("metadata").notNullable();

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("scheduled_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("processed_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("user_id", "idx_notifications_user_id");
    table.index("scheduled_at", "idx_notifications_scheduled_at");
    table.index("processed_at", "idx_notifications_processed_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications_reminders");
}
