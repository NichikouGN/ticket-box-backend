import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { createOrderSchema, listOrdersQuerySchema, uuidSchema } from "../types/order.types.js";
import { OrderService } from "../services/order.service.js";
import { Redis } from "ioredis";

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
 * Streams the order status and payment URL to the client using Server-Sent Events (SSE).
 * @param req - The Express request object containing the order ID in the URL parameters.
 * @param res - The Express response object used to send SSE data back to the client.
 * @returns A stream of events indicating the current status of the order and the payment URL if applicable.
 * If the order is already in a final state (PENDING_PAYMENT, COMPLETED, FAILED, EXPIRED), it sends the current status immediately and ends the stream.
 * Otherwise, it keeps the connection open and listens for updates on the order status, sending updates to the client as they occur. The connection will be closed after 2 minutes or when the client disconnects.
 */
import { activeSSEConnections } from "../index.js";
export const streamOrderUrl = async (req: Request, res: Response) => {
  const params = uuidSchema.safeParse(req.params.orderId);
  if (!params.success) {
    return res.status(400).json({ success: false, message: "Invalid order id" });
  }
  const orderId = params.data;

  console.log(`[SSE] Client connected for order ID: ${orderId}`);

  let currentStatus;
  try {
    currentStatus = await OrderService.getOrderUrl(orderId);
    console.log(`[SSE] Current status for order ID ${orderId}:`, currentStatus);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  console.log(`[SSE] Checking status for order ID ${orderId}`);
  console.log(`[SSE] Current status for order ID ${orderId}:`, currentStatus.status);
  if (["PENDING_PAYMENT", "COMPLETED", "FAILED", "EXPIRED"].includes(currentStatus.status)) {
    console.log(
      `[SSE] Order ID ${orderId} is in final state. Sending current status and closing connection.`,
    );
    res.write(`event: ORDER_UPDATED\n`);
    res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
    return res.end();
  }

  activeSSEConnections.set(orderId, res);
  const keepAliveInterval = setInterval(() => res.write(":\n\n"), 15000);

  const timeout = setTimeout(() => {
    res.write(`event: TIMEOUT\n`);
    res.write(`data: {}\n\n`);
    res.end();
  }, 120_000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    clearTimeout(timeout);
    activeSSEConnections.delete(orderId);
  });
};
