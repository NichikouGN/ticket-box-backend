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
      .string("Artists must be provided as a JSON string")
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
      .pipe(
        z.array(
          z.object({
            id: z.string().uuid("Invalid artist ID"),
            name: z.string().min(1, "Artist name cannot be empty"),
          }),
        ),
      ),

    concertId: z
      .string()
      .transform((val, ctx) => {
        try {
          const parsed = JSON.parse(val);
          return parsed;
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid JSON format for concert ID",
          });
          return z.NEVER;
        }
      })
      .pipe(z.string().uuid("Invalid concert ID")),
  }),
});

export const AIResponseSchema = z.object({
  matchedArtists: z.array(
    z.object({
      trackingId: z.string(),
      artistName: z.string(),
      biography: z.string(),
    }),
  ),
});

export type ArtistResult = {
  id: string;
  name: string;
};

export type CreateArtistsInput = z.infer<typeof createArtistsSchema>;
export type PdfUploadInput = z.infer<typeof pdfUploadSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
