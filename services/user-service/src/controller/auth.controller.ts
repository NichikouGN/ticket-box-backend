import { AuthService } from "../services/auth.service.js";
import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";
import { signInSchema, signUpSchema, refreshTokenSchema } from "../types/auth.types.js";

export const AuthController = {
  signup: async (req: Request, res: Response) => {
    try {
      const parsedBody = signUpSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res
          .status(400)
          .json({ success: false, message: parsedBody.error.issues[0]?.message ?? "Invalid input" });
      }

      const { email, password, fullName } = parsedBody.data;
      await AuthService.signup({ email, password, fullName });

      return res.status(201).json({ success: true, message: "User created successfully, Please sign in." });
    } catch (err) {
      console.log("AppError:", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  signin: async (req: Request, res: Response) => {
    try {
      const parsedBody = signInSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res
          .status(400)
          .json({ success: false, message: parsedBody.error.issues[0]?.message ?? "Invalid input" });
      }
      const { email, password } = parsedBody.data;

      const result = await AuthService.signin({ email, password });

      return res.status(200).json({
        success: true,
        message: "Sign in successful",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      console.log("AppError:", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  requestNewAccessToken: async (req: Request, res: Response) => {
    try {
      const parsedBody = refreshTokenSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res
          .status(400)
          .json({ success: false, message: parsedBody.error.issues[0]?.message ?? "Invalid input" });
      }
      const { refreshToken } = parsedBody.data;
      const result = await AuthService.refreshAccessToken({ refreshToken });

      return res.status(200).json({
        success: true,
        message: "New access token generated successfully",
        accessToken: result.accessToken,
      });
    } catch (err) {
      console.log("AppError:", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
