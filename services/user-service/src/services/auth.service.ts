import { AppError } from "../types/appError.types.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";
import { UserRepository } from "../repository/user.repository.js";
import crypto from "crypto";

export const AuthService = {
  async signup(email: string, password: string, fullName: string | null) {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

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

  async signin(email: string, password: string) {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

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

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });

    return { accessToken: newAccessToken };
  },
};
