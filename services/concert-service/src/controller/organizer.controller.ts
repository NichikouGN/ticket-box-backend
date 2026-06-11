import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OrganizerService } from "../services/organizer.service.js";
import {
  cancelConcertSchema,
  createConcertSchema,
  updateConcertSchema,
  uuidParamSchema,
} from "../types/concert.types.js";

/**
 * Creates a new concert with the provided details
 * @param req Request object, expects a JSON body with concert details and authentication for organizer access
 * @param res Response object, returns the result of concert creation or an error message
 * @returns Response with status 201 and concert details on success, or appropriate error messages and status codes on failure
 */
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

/**
 * Updates the details of a specific concert
 * @param req Request object, expects a path parameter for concert ID and a JSON body with updated concert details
 * @param res Response object, returns the result of the update or an error message
 * @returns Response with status 200 and updated concert details on success, or appropriate error messages and status codes on failure
 */
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

/**
 * Cancels a specific concert
 * @param req Request object, expects a path parameter for concert ID and a JSON body with cancellation details
 * @param res Response object, returns the result of the cancellation or an error message
 * @returns Response with status 200 and cancellation confirmation on success, or appropriate error messages and status codes on failure
 */
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

    await OrganizerService.cancelConcert(
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

/**
 * Publishes a specific concert
 * @param req Request object, expects a path parameter for concert ID and authentication for organizer access
 * @param res Response object, returns the result of the publication or an error message
 * @returns Response with status 200 and publication confirmation on success, or appropriate error messages and status codes on failure
 */
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

/**
 * Restores a specific concert
 * @param req Request object, expects a path parameter for concert ID and authentication for organizer access
 * @param res Response object, returns the result of the restoration or an error message
 * @returns Response with status 200 and restoration confirmation on success, or appropriate error messages and status codes on failure
 */
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
