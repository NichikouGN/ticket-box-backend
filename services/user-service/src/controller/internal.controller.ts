import type { Request, Response } from "express";
import { uuidParamSchema } from "../types/user.types.js";
import { UserService } from "../services/user.service.js";
import { AppError } from "../types/appError.types.js";
import logger from "../utils/logger.js";

export const InternalController = {
  getUserById: async (req: Request, res: Response) => {
    logger.info({ params: req.params }, "Internal API request received");
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        success: false,
        message: parsedParams.error.issues[0]?.message ?? "Invalid user ID",
      });
    }
    const { userId } = parsedParams.data;

    try {
      logger.info({ userId }, "Fetching user data for internal API request");
      const user = await UserService.getUserById(userId);

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      logger.error({ userId, error }, "Error fetching user data:");
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      logger.error({ userId, error }, "Unexpected error occurred");
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
