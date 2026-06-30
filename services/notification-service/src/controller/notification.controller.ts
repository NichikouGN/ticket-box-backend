import type { Request, Response } from "express";
import { NotificationQuerySchema, uuidSchema } from "../types/notification.types.js";
import { NotificationService } from "../services/notification.service.js";
import { activeSSEConnections } from "../index.js";
import { AppError } from "../types/appError.types.js";

export const NotificationController = {
  getNotifications: async (req: Request, res: Response) => {
    try {
      const parsedQuery = NotificationQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ success: false, message: "Invalid query parameters", errors: parsedQuery.error });
      }
      const { page, limit } = parsedQuery.data;

      console.log("Parsed query parameters:", { page, limit });

      const parsedUserId = uuidSchema.safeParse(req.user?.userId);
      if (!parsedUserId.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID in token", errors: parsedUserId.error });
      }

      const userId = parsedUserId.data;

      const { data, total } = await NotificationService.getNotificationsForUser(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: data,
        meta: {
          page: page,
          limit: limit,
          total: total,
        },
      });
    } catch (error) {
      console.error("Error in getNotifications controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getDetailedNotification(req: Request, res: Response) {
    try {
      const parsedParams = uuidSchema.safeParse(req.params.notificationId);
      if (!parsedParams.success) {
        return res.status(400).json({ success: false, message: "Invalid notification ID", errors: parsedParams.error });
      }

      const parsedUserId = uuidSchema.safeParse(req.user?.userId);
      if (!parsedUserId.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID in token", errors: parsedUserId.error });
      }

      const notificationId = parsedParams.data;
      const userId = parsedUserId.data;

      const detailedNotification = await NotificationService.getDetailedNotification(userId, notificationId);
      if (!detailedNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      return res.status(200).json({ success: true, data: detailedNotification });
    } catch (error) {
      console.error("Error in getDetailedNotification controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  streamNotificationUpdates: async (req: Request, res: Response) => {
    try {
      const parsedUserId = uuidSchema.safeParse(req.user?.userId);
      if (!parsedUserId.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID in token", errors: parsedUserId.error });
      }
      const userId = parsedUserId.data;

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      activeSSEConnections.set(userId, res);
      const keepAliveInterval = setInterval(() => res.write(":\n\n"), 15000);

      const timeout = setTimeout(() => {
        res.write(`event: TIMEOUT\n`);
        res.write(`data: {}\n\n`);
        res.end();
      }, 120000);

      req.on("close", () => {
        clearInterval(keepAliveInterval);
        clearTimeout(timeout);
        activeSSEConnections.delete(userId);
      });
    } catch (error) {
      console.error("Error in streamNotificationUpdates controller:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
