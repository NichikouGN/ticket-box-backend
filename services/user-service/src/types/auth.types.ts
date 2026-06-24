import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type role = "ORGANIZER" | "STAFF" | "AUDIENCE";
export type status = "ACTIVE" | "INACTIVE" | "BANNED";
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export interface User {
  id: string;
  email: string;
  password: string;
  role: role;
}

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: role;
}
