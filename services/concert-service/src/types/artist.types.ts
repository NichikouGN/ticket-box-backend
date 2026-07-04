import { buffer } from "stream/consumers";
import { z } from "zod";

export const createArtistsSchema = z.object({
  name: z.array(z.string()).min(1, "At least one artist name is required"),
});

export const linkArtistToConcertSchema = z.object({
  artistIds: z.array(z.string().uuid("Invalid artist ID")),
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
    artistIds: z
      .string("Artist IDs must be provided as a JSON string")
      .transform((val, ctx) => {
        try {
          const parsed = JSON.parse(val);
          return parsed;
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid JSON format for artist IDs",
          });
          return z.NEVER;
        }
      })
      .pipe(z.array(z.string().uuid("Each artist ID must be a valid UUID"))),
  }),
});

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

export const AIResponseSchema = z.object({
  matchedArtists: z.array(
    z.object({
      trackingId: z.string(),
      artistName: z.string(),
      aiBio: z.string(),
    }),
  ),
});

export const artistBioReviewParamsSchema = z.object({
  concertId: z.string().uuid("Invalid concert ID"),
  artistId: z.string().uuid("Invalid artist ID"),
});

export const artistBioReviewBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], "Status must be either 'APPROVED' or 'REJECTED'"),
});

export type ArtistResult = {
  id: string;
  name: string;
};

export type CreateArtistsInput = z.infer<typeof createArtistsSchema>;
export type LinkArtistToConcertInput = z.infer<typeof linkArtistToConcertSchema>;
export type PdfUploadInput = z.infer<typeof pdfUploadSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type ArtistBioReviewParams = z.infer<typeof artistBioReviewParamsSchema>;
export type ArtistBioReviewBody = z.infer<typeof artistBioReviewBodySchema>;
