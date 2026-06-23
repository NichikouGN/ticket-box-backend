import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OrganizerService } from "../services/organizer.service.js";
import { createConcertSchema } from "../types/concert.types.js";
import { createArtistsSchema, pdfUploadSchema } from "../types/artist.types.js";

export const OrganizerController = {
  async createConcert(req: Request, res: Response) {
    try {
      const parsedBody = createConcertSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const organizerId = req.user?.userId;
      if (!organizerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await OrganizerService.createConcert(parsedBody.data, organizerId);
      return res.status(201).json({
        success: true,
        message: "Concert created successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

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
      const { existingArtists, newArtists } = await OrganizerService.createArtists(artistName);

      return res.status(201).json({
        success: true,
        message: "Artists created successfully",
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

  async uploadPdf(req: Request, res: Response) {
    try {
      console.log("Received file upload request:", req.file);
      console.log("Received request body:", req.body);

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
      const artists = validateData.data.body.artists;
      const concertId = validateData.data.body.concertId;
      const pdfBase64String = file.buffer.toString("base64");

      await OrganizerService.generateArtistBios(concertId, artists, pdfBase64String, file.mimetype);

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
      console.log("Error in uploadPdfController:", error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
