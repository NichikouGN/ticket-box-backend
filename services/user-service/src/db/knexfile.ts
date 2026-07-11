import knex from "knex";
import dotenv from "dotenv";
dotenv.config();

// Update with your config settings.
const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  pool: {
    min: 2,
    max: 4,
  },
});

export default db;
