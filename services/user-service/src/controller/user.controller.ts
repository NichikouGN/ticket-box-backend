import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";
import { UserService } from "../services/user.service.js";

/**
 * Retrieves the profile of the authenticated user
 * @param req Request object
 * @param res Response object
 * @returns Promise resolving to the response
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    console.log("Fetching profile for user ID:", userId);
    const user = await UserService.getProfile(userId);

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
