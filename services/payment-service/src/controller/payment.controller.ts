import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { createOrderSchema, createPaymentSchema, uuidSchema } from "../types/payment.types.js";
import { PaymentService } from "../services/payment.service.js";

export const createPayment = async (req: Request, res: Response) => {
  try {
    const parsedBody = createOrderSchema.safeParse({
      ...req.body,
      idempotencyKey: req.headers["idempotency-key"],
    });

    if (!parsedBody.success) {
      console.log("Validation failed for create payment request:", parsedBody.error.issues);
      return res.status(400).json({
        success: false,
        message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await PaymentService.createPayment(parsedBody.data);

    return res.status(201).json({
      success: true,
      message: "Payment initialized successfully.",
      data: result,
    });
  } catch (error) {
    console.error("[Payment Controller - createPayment]: Error creating payment:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// export const getPayment = async (req: Request, res: Response) => {
//   try {
//     const parsedParams = uuidSchema.safeParse(req.params.paymentId);
//     if (!parsedParams.success) {
//       return res.status(400).json({ success: false, message: "Invalid payment id" });
//     }

//     const result = await PaymentService.getPayment(parsedParams.data);

//     return res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("[Payment Controller - getPayment]: Error fetching payment:", error);
//     if (error instanceof AppError) {
//       return res.status(error.statusCode).json({ success: false, message: error.message });
//     }

//     return res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

export const getPaymentUrl = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidSchema.safeParse(req.params.orderId);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const result = await PaymentService.getPaymentUrl(parsedParams.data);

    if (!result) {
      return res.status(404).json({ success: false, message: "Payment URL not found" });
    }

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
