import { UserRepository } from "../repository/user.repository.js";
import { AppError } from "../types/appError.types.js";
import { validate as isUuid } from "uuid";
import type { role, status } from "../types/auth.types.js";

export const OrganizerService = {
  getAllUsers: async ({
    page,
    limit,
    status,
    role,
  }: {
    page: number;
    limit: number;
    status: status | undefined;
    role: role | undefined;
  }) => {
    const offset = (page - 1) * limit;
    const result = await UserRepository.getAllUsers({
      offset,
      limit,
      status,
      role,
    });
    return result;
  },

  updateUserRole: async (userId: string, targetId: string, role: role) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!isUuid(targetId)) {
      throw new AppError("Invalid target ID format", 400);
    }

    if (userId === targetId) {
      throw new AppError("You cannot change your own role", 400);
    }

    if (!["AUDIENCE", "STAFF", "ORGANIZER"].includes(role)) {
      throw new AppError("Invalid role provided (must be AUDIENCE, STAFF, or ORGANIZER)", 400);
    }

    const updatedUser = await UserRepository.updateUserRole(targetId, role);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }
    return updatedUser;
  },

  updateUserStatus: async (userId: string, targetId: string, status: status) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!isUuid(targetId)) {
      throw new AppError("Invalid target ID format", 400);
    }

    if (userId === targetId) {
      throw new AppError("You cannot change your own status", 400);
    }

    if (!["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
      throw new AppError("Invalid status provided (must be ACTIVE, INACTIVE, or BANNED)", 400);
    }

    const updatedUser = await UserRepository.updateUserStatus(targetId, status);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }
    return updatedUser;
  },
};
