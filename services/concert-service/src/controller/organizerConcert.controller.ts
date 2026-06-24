import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import {
  createConcertSchema,
  concertIdParamSchema,
  updateConcertSchema,
  updateConcertStatusSchema,
} from "../types/concert.types.js";
import { OrganizerConcertService } from "../services/organizerConcert.service.js";

export const OrganizerConcertController = {
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

      const result = await OrganizerConcertService.createConcert(parsedBody.data, organizerId);
      return res.status(201).json({
        success: true,
        message:
          "Concert created successfully. Concert is in DRAFT status and can only be seen by organizers. Please review other information before publishing.",
        data: { concertId: result },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async updateConcert(req: Request, res: Response) {
    try {
      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const parsedBody = updateConcertSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const concertId = parsedParams.data.concertId;
      const updateData = parsedBody.data;

      const result = await OrganizerConcertService.updateConcert(concertId, updateData);
      return res.status(200).json({
        success: true,
        message: "Concert updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in updateConcert controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async updateConcertStatus(req: Request, res: Response) {
    try {
      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const parsedBody = updateConcertStatusSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
      }

      const concertId = parsedParams.data.concertId;
      const status = parsedBody.data.status;

      const result = await OrganizerConcertService.updateConcertStatus(concertId, status);

      return res.status(200).json({
        success: true,
        message: `Concert status updated to ${status} successfully`,
        data: result,
      });
    } catch (error) {
      console.error("Error in updateConcertStatus controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
