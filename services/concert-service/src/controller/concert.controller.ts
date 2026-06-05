import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { ConcertService } from "../services/concert.service.js";
import { listQuerySchema, uuidParamSchema } from "../types/concert.types.js";

export const getHealth = async (_req: Request, res: Response) => {
  const health = await ConcertService.getHealth();
  return res.status(200).json({ success: true, data: health });
};

export const getConcerts = async (req: Request, res: Response) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid query" });
    }

    const result = await ConcertService.listConcerts(parsed.data.page, parsed.data.limit);
    return res.status(200).json({
      success: true,
      data: result.data,
      Pagination: {
        current_page: result.pagination.current_page,
        total_page: result.pagination.total_page,
        total_items: result.pagination.total_items,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getConcertDetail = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const result = await ConcertService.getConcertDetail(parsed.data.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getConcertTickets = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const result = await ConcertService.getConcertTickets(parsed.data.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getConcertStock = async (req: Request, res: Response) => {
  try {
    const parsed = uuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid concert id" });
    }

    const result = await ConcertService.getConcertStock(parsed.data.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
