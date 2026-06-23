import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OrganizerService } from "../services/organizer.service.js";
import {
  cancelConcertSchema,
  createConcertSchema,
  updateConcertSchema,
  uuidParamSchema,
} from "../types/concert.types.js";
import { createArtistsSchema, pdfUploadSchema } from "../types/artist.types.js";

export const uploadPdfController = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const validateData = pdfUploadSchema.safeParse(req.file, req.body);
    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        message: validateData.error.issues[0]?.message ?? "Invalid file upload",
      });
    }

    const file = validateData.data.file;
    const artists = validateData.data.body.artists;

    console.log("Uploaded PDF file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    console.log("Associated artists:", artists);

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
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createArtists = async (req: Request, res: Response) => {
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
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createConcert = async (req: Request, res: Response) => {
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
};

export const updateConcert = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const parsedBody = updateConcertSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    await OrganizerService.updateConcert(parsedParams.data.id, parsedBody.data);
    return res.status(200).json({
      success: true,
      message: "Concert updated successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const cancelConcert = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const parsedBody = cancelConcertSchema.safeParse(req.body);
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

    await OrganizerService.cancelConcert(parsedParams.data.id, organizerId, parsedBody.data.reason ?? null);
    return res.status(200).json({
      success: true,
      message: "Concert đã bị hủy. Thông báo đang được gửi đến người dùng.",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const publishConcert = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const organizerId = req.user?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await OrganizerService.publishConcert(parsedParams.data.id, organizerId);
    return res.status(200).json({
      success: true,
      message: "Concert published successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const restoreConcert = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const organizerId = req.user?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await OrganizerService.restoreConcert(parsedParams.data.id, organizerId);
    return res.status(200).json({
      success: true,
      message: "Concert restored successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
