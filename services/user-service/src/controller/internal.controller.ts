import type { Request, Response } from "express";
import { uuidParamSchema } from "../types/user.types.js";
import { UserService } from "../services/user.service.js";
import { AppError } from "../types/appError.types.js";

export const InternalController = {
  getUserById: async (req: Request, res: Response) => {
    const parsedParams = uuidParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        success: false,
        message: parsedParams.error.issues[0]?.message ?? "Invalid user ID",
      });
    }
    const { userId } = parsedParams.data;

    try {
      const user = await UserService.getProfile(userId);

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
