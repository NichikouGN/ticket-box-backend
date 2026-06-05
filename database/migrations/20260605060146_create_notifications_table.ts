import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("notifications", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.text("idempotency_key").notNullable().unique();

    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.string("type", 50).notNullable().checkIn(["ORDER_CONFIRM", "REMINDER_24H"]);

    table.string("title", 255).notNullable();

    table.text("message").notNullable();

    table.text("status").notNullable().defaultTo("pending").checkIn(["pending", "sent", "failed"]);

    table.text("user_status").notNullable().defaultTo("unread").checkIn(["read", "unread"]);

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp("sent_at", { useTz: true });

    table.index("user_id", "idx_notifications_user_id");
    table.index("created_at", "idx_notifications_created_at");
    table.index("status", "idx_notifications_status");
    table.index("user_status", "idx_notifications_user_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("notifications");
}
