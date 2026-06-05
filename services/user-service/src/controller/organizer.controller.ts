import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";
import { OrganizerService } from "../services/organizer.service.js";
import type { role, status } from "../types/auth.types.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as status | undefined;
    const role = req.query.role as role | undefined;

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
    const userId = req.user?.userId as string;
    const targetId = req.params.id as string;
    const { role } = req.body;

    console.log("Update User Role Request:", { userId, targetId, role });

    const updatedUser = await OrganizerService.updateUserRole(userId, targetId, role);
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
    const userId = req.user?.userId as string;
    const targetId = req.params.id as string;
    const { status } = req.body;

    console.log("Update User Status Request:", { userId, targetId, status });

    const updatedUser = await OrganizerService.updateUserStatus(userId, targetId, status);
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.log("AppError:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
