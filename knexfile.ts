import type { Knex } from "knex";
import dotenv from "dotenv";
dotenv.config();

// Update with your config settings.
const config: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  migrations: {
    directory: "./database/migrations",
  },
  seeds: {
    directory: "./database/seeds",
  },
};

export default config;
