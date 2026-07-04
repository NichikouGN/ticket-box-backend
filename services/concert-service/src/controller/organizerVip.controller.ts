import { concertIdParamSchema, listQuerySchema, vipCheckInParamSchema } from "../types/concert.types.js";
import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OrganizerVipService } from "../services/organizerVip.service.js";
import { csvUploadSchema } from "../types/artist.types.js";

export const OrganizerVipController = {
  async importVipGuests(req: Request, res: Response) {
    try {
      console.log(`Received request to import VIP guests for concert ID: ${req.params.concertId}`);
      console.log(`CSV file received: ${req.file ? req.file.originalname : "No file uploaded"}`);

      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const validateData = csvUploadSchema.safeParse({ file: req.file });
      if (!validateData.success) {
        return res.status(400).json({
          success: false,
          message: validateData.error.issues[0]?.message ?? "Invalid CSV file",
        });
      }

      const concertId = parsedParams.data.concertId;
      const file = validateData.data.file;

      await OrganizerVipService.importVipGuests(concertId, file.buffer);

      return res.status(200).json({
        success: true,
        message: "VIP guests imported successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getVipGuests(req: Request, res: Response) {
    try {
      console.log(`Received request to get VIP guests for concert ID: ${req.params.concertId}`);

      const parsedParams = concertIdParamSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({
          success: false,
          message: parsedParams.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const parsedQuery = listQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: parsedQuery.error.issues[0]?.message ?? "Invalid query parameters",
        });
      }

      const concertId = parsedParams.data.concertId;
      const page = parsedQuery.data.page;
      const limit = parsedQuery.data.limit;

      const { vipGuests, totalCount } = await OrganizerVipService.getVipGuests(concertId, page, limit);

      return res.status(200).json({
        success: true,
        data: vipGuests,
        meta: {
          page,
          limit,
          total: totalCount,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async checkInVipGuest(req: Request, res: Response) {
    try {
      console.log(
        `Received request to check-in VIP guest ID: ${req.params.vipGuestId} for concert ID: ${req.params.concertId}`,
      );

      const parsedVipCheckInParam = vipCheckInParamSchema.safeParse(req.params);
      if (!parsedVipCheckInParam.success) {
        return res.status(400).json({
          success: false,
          message: parsedVipCheckInParam.error.issues[0]?.message ?? "Invalid request parameters",
        });
      }

      const vipGuestId = parsedVipCheckInParam.data.vipGuestId;
      const concertId = parsedVipCheckInParam.data.concertId;

      await OrganizerVipService.checkInVipGuest(concertId, vipGuestId);

      return res.status(200).json({
        success: true,
        message: "VIP guest checked in successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
