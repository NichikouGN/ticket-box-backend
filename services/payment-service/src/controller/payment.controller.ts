import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";

import { PaymentService } from "../services/payment.service.js";
import { uuidSchema } from "../types/payment.types.js";

export const getPaymentUrl = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidSchema.safeParse(req.params.orderId);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const orderId = parsedParams.data;

    const result = await PaymentService.getPaymentUrl(orderId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Payment Controller - getPaymentUrl]: Error fetching payment URL:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
