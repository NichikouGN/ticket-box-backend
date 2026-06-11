import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { createOrderSchema, createPaymentSchema, uuidSchema } from "../types/payment.types.js";
import { PaymentService } from "../services/payment.service.js";

/**
 * Creates a new payment based on the provided request data.
 * @param req Request object containing payment creation data in the body and idempotency key in the headers
 * @param res Response object used to send back the result of the payment creation process, including success status, message, and payment details if successful
 * @returns A JSON response indicating the success or failure of the payment creation operation, along with relevant messages and data. If the request body is invalid or if there is an error during payment creation, it returns appropriate error responses with status codes and messages.
 */
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

/**
 * Retrieves a payment by its ID.
 * @param req Request object containing the payment ID in the URL parameters
 * @param res Response object used to send back the result of the payment retrieval process, including success status, message, and payment details if successful
 * @returns A JSON response indicating the success or failure of the payment retrieval operation, along with relevant messages and data.
 */
export const getPayment = async (req: Request, res: Response) => {
  try {
    const parsedParams = uuidSchema.safeParse(req.params.paymentId);
    if (!parsedParams.success) {
      return res.status(400).json({ success: false, message: "Invalid payment id" });
    }

    const result = await PaymentService.getPayment(parsedParams.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Payment Controller - getPayment]: Error fetching payment:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
