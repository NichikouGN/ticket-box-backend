import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No authorization header provided, continuing without authentication");
    // If no authorization header is present, continue without authentication
    return next();
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided, continuing without authentication");
    return next(); // No token provided, continue without authentication
  }

  try {
    req.user = verifyAccessToken(token);
    console.log("Token verified successfully, user authenticated:", req.user);
    return next();
  } catch {
    console.log("Invalid token, continuing without authentication");
    return next(); // Invalid token, continue without authentication
  }
};
