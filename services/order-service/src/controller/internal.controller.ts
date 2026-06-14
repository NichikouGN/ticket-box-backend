import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OutboxService } from "../services/outbox.service.js";
import { OutboxEventStatusUpdateSchema, uuidSchema } from "../types/internal.types.js";
import logger from "../utils/logger.js";

export const updateOutboxEventStatus = async (req: Request, res: Response) => {
  try {
    logger.info(
      "===================== [OrderService - Controller - updateOutboxEventStatus] =====================",
    );

    const parsedParams = uuidSchema.safeParse(req.params.eventId);
    if (!parsedParams.success) {
      throw new AppError("Invalid eventId parameter", 400);
    }

    const parsedBody = OutboxEventStatusUpdateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError("Invalid request body", 400);
    }

    const eventId = parsedParams.data;
    const status = parsedBody.data.status;

    const result = await OutboxService.updateEventStatus(eventId, status);

    if (result) {
      return res.status(200).json({ success: true, message: "Outbox event status updated" });
    } else {
      return res.status(404).json({ success: false, message: "Outbox event not found" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
