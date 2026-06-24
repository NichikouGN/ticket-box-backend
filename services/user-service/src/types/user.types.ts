import { z } from "zod";

export const uuidParamSchema = z.object({
  userId: z.uuid(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const listUsersQuerySchema = listQuerySchema.extend({
  status: z.enum(["ACTIVE", "BANNED", "INACTIVE"]).optional(),
  role: z.enum(["ORGANIZER", "STAFF", "AUDIENCE"]).optional(),
});

export const updateUserRoleSchema = z.object({
  targetId: z.uuid({ error: "Invalid target ID" }),
  role: z
    .enum(["ORGANIZER", "STAFF", "AUDIENCE"], {
      error: "Invalid role, must be one of ORGANIZER, STAFF, or AUDIENCE",
    })
    .describe("The role to update the user to"),
});

export const updateUserStatusSchema = z.object({
  targetId: z.uuid({ error: "Invalid target ID" }),
  status: z
    .enum(["ACTIVE", "BANNED", "INACTIVE"], {
      error: "Invalid status, must be one of ACTIVE, BANNED, or INACTIVE",
    })
    .describe("The status to update the user to"),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
