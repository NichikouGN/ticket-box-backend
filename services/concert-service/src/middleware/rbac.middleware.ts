import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/auth.types.js";

export const rbacMiddleware = (requiredRole: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!requiredRole.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return next();
  };
};
