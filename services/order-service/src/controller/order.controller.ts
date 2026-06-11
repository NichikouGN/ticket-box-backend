import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { createOrderSchema, listOrdersQuerySchema, uuidSchema } from "../types/order.types.js";
import { OrderService } from "../services/order.service.js";

/**
 * Creates a new order.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A JSON response indicating the success or failure of the operation.
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const parsedBody = createOrderSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey || Array.isArray(idempotencyKey)) {
      return res.status(400).json({ success: false, message: "Idempotency-Key is required" });
    }

    console.log(
      "[Step 1] Request validated successfully. Creating order with data:",
      parsedBody.data,
    );

    const result = await OrderService.createOrder(
      req.user?.userId || "",
      parsedBody.data,
      idempotencyKey,
    );

    console.log("Order created successfully:", result);

    return res.status(201).json({
      success: true,
      message: "Ticket reserved successfully. Please proceed to payment.",
      data: result,
    });
  } catch (error) {
    console.error("[Order Controller - createOrder]: Error creating order:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Lists orders.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A JSON response containing the list of orders and pagination information.
 */
export const getOrderUrl = async (req: Request, res: Response) => {
  try {
    const params = uuidSchema.safeParse(req.params.orderId);
    if (!params.success) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const orderId = params.data;
    console.log("orderId:", orderId);

    const result = await OrderService.getOrderUrl(orderId);
    console.log("Fetched order successfully:", result);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Order Controller - getOrderUrl]: Error fetching order:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
