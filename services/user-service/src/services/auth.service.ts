import { AppError } from "../types/appError.types.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";
import { UserRepository } from "../repository/user.repository.js";
import crypto from "crypto";
import type { SignInInput, SignUpInput, RefreshTokenInput } from "../types/user.types.js";

export const AuthService = {
  async signup({ email, password, fullName }: SignUpInput) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user
    await UserRepository.createNewUser({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName || null,
      role: "AUDIENCE",
      status: "ACTIVE",
    });
  },

  async signin({ email, password }: SignInInput) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    return { accessToken, refreshToken };
  },

  async refreshAccessToken({ refreshToken }: RefreshTokenInput) {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });

    return { accessToken: newAccessToken };
  },
};
