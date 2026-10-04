import type { Knex } from "knex";
import dotenv from "dotenv";
dotenv.config({quiet: true});

console.log("DB_URL:", process.env.DB_URL);

// Update with your config settings.
const config: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.DB_URL,
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  },
  migrations: {
    directory: "./database/migrations",
  },
  seeds: {
    directory: "./database/seeds",
  },
};

export default config;
