import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { OutboxService } from "../services/outbox.service.js";
import { OutboxEventSchema, uuidSchema } from "../types/internal.types.js";
import logger from "../utils/logger.js";
import { OrderService } from "../services/order.service.js";

export const handlePaymentFailed = async (req: Request, res: Response) => {
  try {
    logger.info(
      "===================== [OrderService - Controller - handlePaymentFailed] =====================",
    );

    const parsedParams = uuidSchema.safeParse(req.params.orderId);
    if (!parsedParams.success) {
      throw new AppError("Invalid orderId parameter", 400);
    }

    const parsedBody = OutboxEventSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError("Invalid request body", 400);
    }

    const orderId = parsedParams.data;
    const eventId = parsedBody.data.eventId;

    await OrderService.markOrderAsFailed(orderId);
    await OutboxService.updateEventStatus(eventId, "COMPLETED");

    // await OrderService.rollbackStocks();
    await OrderService.publishOrderUpdate(orderId, "PAYMENT_FAILED");
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
