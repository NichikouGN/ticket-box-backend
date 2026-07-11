import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DB_URL) {
  throw new Error("DB_URL is not defined in environment variables.");
}

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  pool: {
    min: 1,
    max: 2,
  },
});

export default db;
