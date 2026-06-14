import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const OutboxEventStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "PROCESSED", "FAILED"]),
});
