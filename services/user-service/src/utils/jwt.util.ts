import jwt from "jsonwebtoken";
import ms from "ms";
import { AppError } from "../types/appError.types.js";
import dotenv from "dotenv";
import type { AuthPayload } from "../types/auth.types.js";
dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = (process.env.ACCESS_TOKEN_EXPIRATION || "15m") as ms.StringValue;
const REFRESH_TOKEN_EXPIRATION = (process.env.REFRESH_TOKEN_EXPIRATION || "7d") as ms.StringValue;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets are not defined in environment variables.");
}

export const signAccessToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ms(ACCESS_TOKEN_EXPIRATION) / 1000, // Convert milliseconds to seconds for jwt
  });
};

export const signRefreshToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: ms(REFRESH_TOKEN_EXPIRATION) / 1000, // Convert milliseconds to seconds for jwt
  });
};

export const verifyAccessToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthPayload;
  } catch (err) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const verifyRefreshToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as AuthPayload;
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};
