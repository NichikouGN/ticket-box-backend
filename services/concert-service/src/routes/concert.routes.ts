import { Router } from "express";
import { ConcertController } from "../controller/concert.controller.js";
import { optionalAuthMiddleware } from "../middleware/optionalAuth.middleware.js";

const router = Router();

router.use(optionalAuthMiddleware);

router.get("/", ConcertController.getConcerts);
router.get("/:concertId", ConcertController.getConcertDetail);

router.get("/:concertId/ticket-types", ConcertController.getConcertTickets);
router.get("/:concertId/stocks", ConcertController.getConcertStock);

export default router;
