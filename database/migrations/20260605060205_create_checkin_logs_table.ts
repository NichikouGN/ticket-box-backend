import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("checkin_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("ticket_id").notNullable().references("id").inTable("tickets").onDelete("RESTRICT");

    table.uuid("staff_id").notNullable().references("id").inTable("users").onDelete("SET NULL");

    table.timestamp("scanned_at", { useTz: true }).defaultTo(knex.fn.now());

    table.text("result").notNullable().checkIn(["success", "already_used", "invalid"]);

    table.index("ticket_id", "idx_checkin_logs_ticket_id");
    table.index("staff_id", "idx_checkin_logs_staff_id");
    table.index("scanned_at", "idx_checkin_logs_scanned_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("checkin_logs");
}
