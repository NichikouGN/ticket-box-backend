import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";
import { OrganizerService } from "../services/organizer.service.js";
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../types/user.types.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { page, limit, status, role } = parsed.data;

    const users = await OrganizerService.getAllUsers({
      page,
      limit,
      status,
      role,
    });
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.log("AppError:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const parsed = updateUserRoleSchema.safeParse({ ...req.params, ...req.body, ...req.user });
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }

    const { targetId, userId, role } = parsed.data;

    const updatedUser = await OrganizerService.updateUserRole({ userId, targetId, role });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.log("AppError:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateUserStatusSchema.safeParse({ ...req.params, ...req.body, ...req.user });
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }

    const { targetId, userId, status } = parsed.data;

    const updatedUser = await OrganizerService.updateUserStatus({ userId, targetId, status });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.log("AppError:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
