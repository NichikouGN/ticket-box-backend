import type { Request, Response } from "express";
import { NotificationQuerySchema, uuidSchema } from "../types/notification.types.js";
import { NotificationService } from "../services/notification.service.js";
import { activeSSEConnections } from "../index.js";

export const NotificationController = {
  getNotifications: async (req: Request, res: Response) => {
    const parsedQuery = NotificationQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({ success: false, message: "Invalid query parameters", errors: parsedQuery.error });
    }
    const { page, limit } = parsedQuery.data;

    const parsedUserId = uuidSchema.safeParse(req.user?.id);
    if (!parsedUserId.success) {
      return res.status(400).json({ success: false, message: "Invalid user ID in token", errors: parsedUserId.error });
    }

    const userId = parsedUserId.data;

    const result = await NotificationService.getNotificationsForUser(userId, page, limit);
    return res.status(200).json({ success: true, data: result });
  },

  streamNotificationUpdates: async (req: Request, res: Response) => {
    const parsedUserId = uuidSchema.safeParse(req.user?.id);
    if (!parsedUserId.success) {
      return res.status(400).json({ success: false, message: "Invalid user ID in token", errors: parsedUserId.error });
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
    });

    req.on("close", () => {
      clearInterval(keepAliveInterval);
      clearTimeout(timeout);
      activeSSEConnections.delete(userId);
    });
  },
};
