import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { concertIdParamSchema } from "../types/concert.types.js";
import { OrganizerArtistService } from "../services/organizerArtist.service.js";
import {
  artistBioReviewBodySchema,
  artistBioReviewParamsSchema,
  createArtistsSchema,
  linkArtistToConcertSchema,
  pdfUploadSchema,
} from "../types/artist.types.js";

export const ArtistController = {
  async createArtists(req: Request, res: Response) {
    try {
      const parsedBody = createArtistsSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const artistName = parsedBody.data.name;
      const { existingArtists, newArtists } = await OrganizerArtistService.createArtists(artistName);

      return res.status(201).json({
        success: true,
        message: newArtists.length > 0 ? "Artists created successfully" : "All artists already exist",
        data: {
          existingArtists,
          newArtists,
        },
      });
    } catch (error) {
      console.log("Error in createArtists controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async linkArtistToConcert(req: Request, res: Response) {
    try {
      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const parsedBody = linkArtistToConcertSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const concertId = parsedParams.data.concertId;
      const artistIds = parsedBody.data.artistIds as string[];

      console.log("Parsed concert ID:", concertId);
      console.log("Parsed artist IDs:", artistIds);

      await OrganizerArtistService.linkArtistsToConcert(concertId, artistIds);

      return res.status(200).json({
        success: true,
        message: "Artists linked to concert successfully",
      });
    } catch (error) {
      console.log("Error in linkArtistToConcert controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async generateArtistBios(req: Request, res: Response) {
    try {
      console.log("Received file upload request:", req.file);
      console.log("Received request body:", req.body);

      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const validateData = pdfUploadSchema.safeParse({
        file: req.file,
        body: req.body,
      });
      if (!validateData.success) {
        return res.status(400).json({
          success: false,
          message: validateData.error.issues[0]?.message ?? "Invalid file upload",
        });
      }

      const file = validateData.data.file;
      const artistIds = validateData.data.body.artistIds;
      const concertId = parsedParams.data.concertId;
      const pdfBase64String = file.buffer.toString("base64");

      await OrganizerArtistService.generateArtistBios(concertId, artistIds, pdfBase64String, file.mimetype);

      return res.status(200).json({
        success: true,
        message: "PDF uploaded successfully",
        data: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      console.log("Error in generateArtistBios controller:", error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getAwaitingReviewBios(req: Request, res: Response) {
    try {
      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const concertId = parsedParams.data.concertId;
      const awaitingReviewBios = await OrganizerArtistService.getAwaitingReviewBios(concertId);

      return res.status(200).json({
        success: true,
        message: "Awaiting review artist bios retrieved successfully",
        data: awaitingReviewBios,
      });
    } catch (error) {
      console.log("Error in getAwaitingReviewBios controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async updateBioStatus(req: Request, res: Response) {
    try {
      const parsedParams = artistBioReviewParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const validateBody = artistBioReviewBodySchema.safeParse(req.body);
      if (!validateBody.success) {
        return res.status(400).json({
          success: false,
          message: validateBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const concertId = parsedParams.data.concertId;
      const artistId = parsedParams.data.artistId;
      const status = validateBody.data.status;

      await OrganizerArtistService.updateArtistBioStatus(concertId, artistId, status);

      return res.status(200).json({
        success: true,
        message: `Artist bio ${status.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.log("Error in updateBioStatus controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
