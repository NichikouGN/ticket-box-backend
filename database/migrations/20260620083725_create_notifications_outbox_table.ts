import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await knex.schema.createTable("notifications_outbox", (table) => {
    table.uuid("id").primary();
    // table.string("event_type").notNullable().checkIn(["CREATE_PAYMENT_FAILED", "REFUND_PAYMENT"]);
    table.string("event_type").notNullable();
    table.jsonb("payload").notNullable();
    table
      .string("status")
      .notNullable()
      .defaultTo("PENDING")
      .checkIn(["PENDING", "PROCESSED", "FAILED"]);
    // table.integer("retries").notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("next_retry_at").defaultTo(knex.fn.now()).notNullable();
    // table.integer("max_retries").notNullable().defaultTo(3);

    table.index("event_type", "idx_notifications_outbox_event_type");
    table.index("status", "idx_notifications_outbox_status");
    // table.index("retries", "idx_notifications_outbox_retries");
    table.index("next_retry_at", "idx_notifications_outbox_next_retry_at");
  });

  // Add the Postgres trigger function to notify on new outbox events
  await knex.raw(`
    CREATE OR REPLACE FUNCTION notify_notifications_outbox()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM pg_notify('notifications_outbox_channel', row_to_json(NEW)::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Bind the trigger to the table
  await knex.raw(`
    CREATE TRIGGER notifications_outbox_insert_trigger
    AFTER INSERT ON notifications_outbox
    FOR EACH ROW EXECUTE FUNCTION notify_notifications_outbox();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `DROP TRIGGER IF EXISTS notifications_outbox_insert_trigger ON notifications_outbox;`,
  );
  await knex.raw(`DROP FUNCTION IF EXISTS notify_notifications_outbox();`);
  await knex.schema.dropTableIfExists("notifications_outbox");
}
