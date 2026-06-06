import { Router } from "express";
import {
  getConcertDetail,
  getConcertStock,
  getConcertTickets,
  getConcerts,
} from "../controller/concert.controller.js";
import { optionalAuthMiddleware } from "../middleware/optionalAuth.middleware.js";

const router = Router();

router.use(optionalAuthMiddleware);
router.get("/", getConcerts);
router.get("/:id", getConcertDetail);
router.get("/:id/tickets", getConcertTickets);
router.get("/:id/stock", getConcertStock);

export default router;
