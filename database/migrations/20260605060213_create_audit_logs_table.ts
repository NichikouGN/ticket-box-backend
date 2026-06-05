import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  return knex.schema.createTable("audit_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("actor_id").notNullable().references("id").inTable("users").onDelete("RESTRICT");

    table.text("action").notNullable();

    table.text("target_type").notNullable();

    table.uuid("target_id").notNullable();

    table.jsonb("old_value");

    table.jsonb("new_value");

    table.text("reason");

    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());

    table.index("actor_id", "idx_audit_logs_actor_id");
    table.index(["target_type", "target_id"], "idx_audit_logs_target_type_target_id");
    table.index("created_at", "idx_audit_logs_created_at");
    table.index("action", "idx_audit_logs_action");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("audit_logs");
}
