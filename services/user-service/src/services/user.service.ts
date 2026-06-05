import { UserRepository } from "../repository/user.repository.js";
import { AppError } from "../types/appError.types.js";

export const UserService = {
  async getProfile(userId: number) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const userProfile = await UserRepository.getUserProfile(userId);

    if (!userProfile) {
      throw new AppError("User not found", 404);
    }
    return userProfile;
  },
};
