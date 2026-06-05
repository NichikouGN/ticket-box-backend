import { AuthService } from "../services/auth.service.js";
import { AppError } from "../types/appError.types.js";
import type { Request, Response } from "express";

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;
    console.log("Signup request received with email:", email);
    console.log("Signup request received with fullName:", fullName);
    console.log("Signup request received with password:", password);

    await AuthService.signup(email, password, fullName);

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

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.signin(email, password);

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

export const requestNewAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshAccessToken(refreshToken);

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
