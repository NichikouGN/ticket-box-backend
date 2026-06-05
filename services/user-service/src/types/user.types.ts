import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const signUpSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ORGANIZER", "STAFF", "AUDIENCE"]),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BANNED", "DELETED"]),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
