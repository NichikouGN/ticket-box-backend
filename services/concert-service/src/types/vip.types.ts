import { z } from "zod";

export const csvUploadSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.literal("text/csv", "Only CSV files are allowed"),
    buffer: z.instanceof(Buffer),
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  }),
});

export const vipCheckInParamSchema = z.object({
  vipGuestId: z.string().uuid(),
  concertId: z.string().uuid(),
});
