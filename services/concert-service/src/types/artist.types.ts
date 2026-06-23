import { buffer } from "stream/consumers";
import { z } from "zod";

export const createArtistsSchema = z.object({
  name: z.array(z.string()).min(1, "At least one artist name is required"),
});

export const pdfUploadSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.literal("application/pdf", "Only PDF files are allowed"),
    buffer: z.instanceof(Buffer),
    size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  }),
  body: z.object({
    artists: z
      .string()
      .transform((val, ctx) => {
        try {
          const parsed = JSON.parse(val);
          return parsed;
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid JSON format for artists",
          });
          return z.NEVER;
        }
      })
      .pipe(z.array(z.string()).min(1, "At least one artist name is required")),
  }),
});

export type CreateArtistsInput = z.infer<typeof createArtistsSchema>;
export type PdfUploadInput = z.infer<typeof pdfUploadSchema>;
