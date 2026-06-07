import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { createOrderSchema, listOrdersQuerySchema } from "../types/order.types.js";
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

    const result = await OrderService.createOrder(
      req.user?.userId || "",
      parsedBody.data,
      idempotencyKey,
    );

    return res.status(201).json({
      success: true,
      message: "Ticket reserved successfully. Please proceed to payment.",
      data: result,
    });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
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
export const getOrders = async (req: Request, res: Response) => {
  try {
    const parsedQuery = listOrdersQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res
        .status(400)
        .json({ success: false, message: parsedQuery.error.issues[0]?.message ?? "Invalid query" });
    }

    const result = await OrderService.listOrders({
      page: parsedQuery.data.page,
      limit: parsedQuery.data.limit,
      status: parsedQuery.data.status,
      concertId: parsedQuery.data.concertId,
      userId: parsedQuery.data.userId,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getOrders controller:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
