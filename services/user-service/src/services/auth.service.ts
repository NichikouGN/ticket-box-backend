import { AppError } from "../types/appError.types.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";
import { UserRepository } from "../repository/user.repository.js";
import crypto from "crypto";
import type { SignInInput, SignUpInput, RefreshTokenInput } from "../types/auth.types.js";

export const AuthService = {
  /**
   * Signs up a new user
   * @param param0 Email, Password and Full Name of the user
   * @returns Promise resolving when the user is created
   * @throws AppError if email is already registered or if any other error occurs
   */
  async signup({ email, password, fullName }: SignUpInput) {
    const existingUser = await UserRepository.getUserByEmail(email);

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await UserRepository.createNewUser({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName || null,
      role: "AUDIENCE",
      status: "ACTIVE",
    });
  },

  /**
   * Signs in a user
   * @param param0 Email and Password of the user
   * @returns Promise resolving to the access and refresh tokens
   * @throws AppError if email or password is invalid
   */
  async signin({ email, password }: SignInInput) {
    const user = await UserRepository.getUserPassword(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    return { accessToken, refreshToken };
  },

  /**
   * Refreshes the access token using a refresh token
   * @param param0 Refresh token provided by the client
   * @returns Promise resolving to a new access token
   * @throws AppError if the refresh token is invalid or expired
   */
  async refreshAccessToken({ refreshToken }: RefreshTokenInput) {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    return { accessToken: newAccessToken };
  },
};
