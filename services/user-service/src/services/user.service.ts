import { UserRepository } from "../repository/user.repository.js";
import { AppError } from "../types/appError.types.js";

export const UserService = {
  /**
   * Retrieves the profile of a user
   * @param userId Id of the user whose profile is to be retrieved
   * @returns Promise resolving to the user's profile
   * @throws AppError if the user is not found or if the user ID is required
   */
  async getProfile(userId: string) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const userProfile = await UserRepository.getUserById(userId);

    if (!userProfile) {
      throw new AppError("User not found", 404);
    }
    return userProfile;
  },
};
