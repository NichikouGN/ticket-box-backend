import db from "../db/knexfile.js";
import { AppError } from "../types/appError.types.js";
import type { role, status } from "../types/auth.types.js";

export const UserRepository = {
  async getUserById(id: string) {
    let query = await db("users").where("id", id).first();
    return query;
  },

  async findByEmail(email: string) {
    let query = db("users").where("email", email).first();
    return await query;
  },

  async findByUsername(username: string) {
    let query = db("users").where("username", username).first();
    return await query;
  },

  async getUserProfile(userId: string) {
    const user = await this.getUserById(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
    };
  },

  async createNewUser(user: {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    role: role;
    status: status;
  }) {
    await db("users").insert(user);
  },

  async getAllUsers({
    offset,
    limit,
    status,
    role,
  }: {
    offset: number;
    limit: number;
    status: status | undefined;
    role: role | undefined;
  }) {
    let query = db("users").select("id", "email", "full_name", "role");

    if (status) {
      query = query.where("status", status);
    }

    if (role) {
      query = query.where("role", role);
    }

    const result = await query.offset(offset).limit(limit);
    return result;
  },

  updateUserRole: async (userId: string, role: role) => {
    await db("users").where("id", userId).update({ role });

    const updatedUser = await db("users")
      .where("id", userId)
      .select("id", "email", "full_name", "role", "status")
      .first();
    return updatedUser;
  },

  updateUserStatus: async (userId: string, status: status) => {
    await db("users").where("id", userId).update({ status });

    const updatedUser = await db("users")
      .where("id", userId)
      .select("id", "email", "full_name", "role", "status")
      .first();
    return updatedUser;
  },
};
