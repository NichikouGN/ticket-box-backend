import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("role_permissions", (table) => {
    table.integer("role_id").notNullable().references("id").inTable("roles").onDelete("CASCADE");

    table
      .integer("permission_id")
      .notNullable()
      .references("id")
      .inTable("permissions")
      .onDelete("CASCADE");

    table.primary(["role_id", "permission_id"]);

    table.index("role_id", "idx_role_permissions_role_id");
    table.index("permission_id", "idx_role_permissions_permission_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("role_permissions");
}
