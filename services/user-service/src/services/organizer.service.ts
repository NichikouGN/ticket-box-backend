import { UserRepository } from "../repository/user.repository.js";
import { AppError } from "../types/appError.types.js";
import { validate as isUuid } from "uuid";
import type { role, status } from "../types/auth.types.js";
import type { UpdateUserRoleInput, UpdateUserStatusInput } from "../types/user.types.js";

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

  updateUserRole: async ({ userId, targetId, role }: UpdateUserRoleInput) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (userId === targetId) {
      throw new AppError("You cannot change your own role", 400);
    }

    const updatedUser = await UserRepository.updateUserRole(targetId, role);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }
    return updatedUser;
  },

  updateUserStatus: async ({ userId, targetId, status }: UpdateUserStatusInput) => {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (userId === targetId) {
      throw new AppError("You cannot change your own status", 400);
    }

    const updatedUser = await UserRepository.updateUserStatus(targetId, status);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }
    return updatedUser;
  },
};
