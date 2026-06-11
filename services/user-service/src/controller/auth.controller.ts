import { AuthService } from "../services/auth.service.js";
import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";
import { signInSchema, signUpSchema, refreshTokenSchema } from "../types/user.types.js";

/**
 * Handles user signup
 * @param req Request object
 * @param res Response object
 * @returns Promise resolving to the response
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const parssed = signUpSchema.safeParse(req.body);
    if (!parssed.success) {
      return res
        .status(400)
        .json({ success: false, message: parssed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { email, password, fullName } = parssed.data;
    await AuthService.signup({ email, password, fullName });

    return res
      .status(201)
      .json({ success: true, message: "User created successfully, Please sign in." });
  } catch (err) {
    console.log("AppError:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Handles user signin
 * @param req Request object
 * @param res Response object
 * @returns Promise resolving to the response
 */
export const signin = async (req: Request, res: Response) => {
  try {
    const parssed = signInSchema.safeParse(req.body);
    if (!parssed.success) {
      return res
        .status(400)
        .json({ success: false, message: parssed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { email, password } = parssed.data;

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
};

/**
 * Requests a new access token using a refresh token
 * @param req Request object
 * @param res Response object
 * @returns Promise resolving to the response
 */
export const requestNewAccessToken = async (req: Request, res: Response) => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" });
    }
    const { refreshToken } = parsed.data;
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
};
