import db from "../db/knexfile.js";
import type { role, status } from "../types/auth.types.js";

export const UserRepository = {
  //================== Find Methods ==================//
  async getUserById(id: string): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    role: role;
    status: status;
  } | null> {
    const query = await db("users").where("id", id).first();
    if (!query) {
      return null;
    }
    return {
      id: query.id,
      email: query.email,
      fullName: query.full_name,
      role: query.role,
      status: query.status,
    };
  },

  async getUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    role: role;
    status: status;
  } | null> {
    const query = await db("users").where("email", email).first();

    if (!query) {
      return null;
    }

    return {
      id: query.id,
      email: query.email,
      fullName: query.full_name,
      role: query.role,
      status: query.status,
    };
  },

  async getUserByUsername(username: string): Promise<{
    id: string;
    email: string;
    fullName: string | null;
    role: role;
    status: status;
  } | null> {
    const query = await db("users").where("username", username).first();

    if (!query) {
      return null;
    }

    return {
      id: query.id,
      email: query.email,
      fullName: query.full_name,
      role: query.role,
      status: query.status,
    };
  },

  //================== Auth Methods ==================//
  async createNewUser(user: {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    role: role;
    status: status;
  }): Promise<void> {
    await db("users").insert(user);
  },

  async getUserPassword(email: string): Promise<{ id: string; passwordHash: string; role: role } | null> {
    const query = await db("users").where("email", email).select("id", "password_hash", "role").first();

    if (!query) {
      return null;
    }

    return {
      id: query.id,
      passwordHash: query.password_hash,
      role: query.role,
    };
  },

  //================== Fetch Methods ==================//
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
  }): Promise<
    {
      id: string;
      email: string;
      fullName: string | null;
      role: role;
      status: status;
    }[]
  > {
    let query = db("users").select("id", "email", "full_name", "role", "status");

    if (status) {
      query = query.where("status", status);
    }

    if (role) {
      query = query.where("role", role);
    }

    const result = await query.offset(offset).limit(limit);
    return result.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    }));
  },

  //================== Update Methods ==================//
  updateUserRole: async (
    userId: string,
    role: role,
  ): Promise<
    | {
        id: string;
        email: string;
        fullName: string | null;
        role: role;
        status: status;
      }
    | undefined
  > => {
    await db("users").where("id", userId).update({ role });

    const updatedUser = await db("users")
      .where("id", userId)
      .select("id", "email", "full_name", "role", "status")
      .first();
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      status: updatedUser.status,
    };
  },

  updateUserStatus: async (
    userId: string,
    status: status,
  ): Promise<
    | {
        id: string;
        email: string;
        fullName: string | null;
        role: role;
        status: status;
      }
    | undefined
  > => {
    await db("users").where("id", userId).update({ status });

    const updatedUser = await db("users")
      .where("id", userId)
      .select("id", "email", "full_name", "role", "status")
      .first();
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      status: updatedUser.status,
    };
  },
};
