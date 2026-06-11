import { UserRepository } from "../repository/user.repository.js";
import { AppError } from "../types/appError.types.js";
import { validate as isUuid } from "uuid";
import type { role, status } from "../types/auth.types.js";
import type { UpdateUserRoleInput, UpdateUserStatusInput } from "../types/user.types.js";

export const OrganizerService = {
  /**
   * Retrieves a list of all users with pagination and optional filtering by status and role
   * @param param0 Page number and limit for pagination, along with optional status and role filters
   * @returns a paginated list of users matching the specified criteria
   * @throws AppError if any error occurs during the retrieval process
   */
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

  /**
   * Updates the role of a user
   * @param userId Id of the user making the request (organizer)
   * @param targetId Id of the user whose role is to be updated
   * @param role New role for the user
   * @returns Promise resolving to the updated user
   * @throws AppError if any error occurs during the update process
   */
  updateUserRole: async (userId: string, targetId: string, role: role) => {
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

  /**
   * Updates the status of a user
   * @param userId Id of the user making the request (organizer)
   * @param targetId Id of the user whose status is to be updated
   * @param status New status for the user
   * @returns Promise resolving to the updated user
   * @throws AppError if any error occurs during the update process
   */
  updateUserStatus: async (userId: string, targetId: string, status: status) => {
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
