import type { Request, Response } from "express";
import { AppError } from "../types/appError.types.js";
import { ConcertService } from "../services/concert.service.js";
import { listQuerySchema, concertIdParamSchema } from "../types/concert.types.js";

export const getHealth = async (_req: Request, res: Response) => {
  const health = await ConcertService.getHealth();
  return res.status(200).json({ success: true, data: health });
};

export const ConcertController = {
  async getConcerts(req: Request, res: Response) {
    try {
      const parsedQuery = listQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res
          .status(400)
          .json({ success: false, message: parsedQuery.error.issues[0]?.message ?? "Invalid query" });
      }

      const organizerId = req.user?.userId;
      const page = parsedQuery.data.page;
      const limit = parsedQuery.data.limit;

      const result = await ConcertService.listConcerts(page, limit, organizerId);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.total,
      });
    } catch (error) {
      console.error("Error in getConcerts:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getConcertDetail(req: Request, res: Response) {
    try {
      const parsed = concertIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid concert id" });
      }

      const organizerId = req.user?.userId;
      const concertId = parsed.data.concertId;

      const result = await ConcertService.getConcertDetail(concertId, organizerId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error in getConcertDetail:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getConcertTickets(req: Request, res: Response) {
    try {
      const parsed = concertIdParamSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid concert id" });
      }

      const concertId = parsed.data.concertId;
      const organizerId = req.user?.userId;

      const result = await ConcertService.getTicketTypes(concertId, organizerId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error in getConcertTickets:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getConcertStock(req: Request, res: Response) {
    try {
      const parsed = concertIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid concert id" });
      }

      const concertId = parsed.data.concertId;
      const organizerId = req.user?.userId;

      const result = await ConcertService.getStock(concertId, organizerId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
