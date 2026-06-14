import db from "../db/knex.js";
export const UserRepository = {
  getUserById: async (userId: string) => {
    const result = await db.select("*").from("users").where({ id: userId });
    return result[0];
  },
};
