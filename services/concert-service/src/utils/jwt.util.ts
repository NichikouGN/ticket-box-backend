import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AppError } from "../types/appError.types.js";
import type { AuthPayload } from "../types/auth.types.js";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables.");
}

export const verifyAccessToken = (token: string): AuthPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthPayload;
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};
