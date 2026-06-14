import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-internal-api-key"] as string;

  console.log("Internal API key received:", apiKey); // Debug log
  console.log("Expected Internal API key:", process.env.INTERNAL_API_KEY); // Debug log

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    console.log("API key validation failed"); // Debug log
    return res.status(401).json({ success: false, message: "Unauthorized (Invalid API key)" });
  }

  console.log("API key validation passed"); // Debug log
  return next();
};
