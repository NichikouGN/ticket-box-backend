import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.renameColumn("payment_ref", "payment_session_id");
    table.string("payment_intent_id").nullable();
    table.index("payment_intent_id", "idx_payments_payment_intent_id");
  });

  await knex.schema.raw(
    'ALTER INDEX "idx_payments_payment_ref" RENAME TO "idx_payments_payment_session_id"',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.renameColumn("payment_session_id", "payment_ref");
    table.dropIndex("payment_session_id", "idx_payments_payment_session_id");
    table.dropColumn("payment_intent_id");
  });

  await knex.schema.raw(
    'ALTER INDEX "idx_payments_payment_session_id" RENAME TO "idx_payments_payment_ref"',
  );
}
