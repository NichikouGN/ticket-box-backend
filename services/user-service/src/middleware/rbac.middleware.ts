import type { Request, Response, NextFunction } from "express";
import type { role } from "../types/auth.types.js";

export const rbacMiddleware = (requiredRole: role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  };
};
