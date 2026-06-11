import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { ConcertService } from "../services/concert.service.js";
import { listQuerySchema, uuidParamSchema } from "../types/concert.types.js";
import type { AuthPayload } from "../types/auth.types.js";

export const getHealth = async (_req: Request, res: Response) => {
  const health = await ConcertService.getHealth();
  return res.status(200).json({ success: true, data: health });
};

/**
 * Retrieves a list of concerts with pagination and optional filtering by organizer
 * @param req Request object, expects query parameters for pagination and optional authentication for organizer-specific concerts
 * @param res Response object, returns a paginated list of concerts, optionally filtered by organizer if authenticated
 * @returns Response with status 200 and a list of concerts on success, or appropriate error messages and status codes on failure
 */
export const getConcerts = async (req: Request, res: Response) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid query" });
    }

    const organizerId = req.user?.userId;

    const result = await ConcertService.listConcerts(
      parsed.data.page,
      parsed.data.limit,
      organizerId,
    );
    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in getConcerts:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Retrieves the details of a specific concert
 * @param req Request object, expects a path parameter for concert ID and optional authentication for organizer-specific access
 * @param res Response object, returns the details of the requested concert or an error message
 * @returns Response with status 200 and concert details on success, or appropriate error messages and status codes on failure
 */
export const getConcertDetail = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const organizerId = req.user?.userId;

    const result = await ConcertService.getConcertDetail(parsed.data.id, organizerId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Retrieves the ticket details for a specific concert
 * @param req Request object, expects a path parameter for concert ID and optional authentication for organizer-specific access
 * @param res Response object, returns the ticket details of the requested concert or an error message
 * @returns Response with status 200 and ticket details on success, or appropriate error messages and status codes on failure
 */
export const getConcertTickets = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const organizerId = req.user?.userId;

    const result = await ConcertService.getConcertTicketsDetails(parsed.data.id, organizerId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Retrieves the stock details for a specific concert
 * @param req Request object, expects a path parameter for concert ID and optional authentication for organizer-specific access
 * @param res Response object, returns the stock details of the requested concert or an error message
 * @returns Response with status 200 and stock details on success, or appropriate error messages and status codes on failure
 */
export const getConcertStock = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const organizerId = req.user?.userId;

    const result = await ConcertService.getConcertStock(parsed.data.id, organizerId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
