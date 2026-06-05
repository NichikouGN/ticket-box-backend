import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { ConcertService } from "../services/concert.service.js";
import {
  cancelConcertSchema,
  createConcertSchema,
  updateConcertSchema,
  uuidParamSchema,
} from "../types/concert.types.js";

export const createConcert = async (req: Request, res: Response) => {
  try {
    const parsedBody = createConcertSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
    }

    const organizerId = req.user?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await ConcertService.createConcert(parsedBody.data, organizerId);
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
      return res
        .status(400)
        .json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
    }

    await ConcertService.updateConcert(parsedParams.data.id, parsedBody.data);
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
      return res
        .status(400)
        .json({
          success: false,
          message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
        });
    }

    const organizerId = req.user?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await ConcertService.cancelConcert(
      parsedParams.data.id,
      organizerId,
      parsedBody.data.reason ?? null,
    );
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
