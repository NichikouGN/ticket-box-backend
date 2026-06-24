import { Router } from "express";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";
import { internalController } from "../controller/internal.controller.js";
import { ConcertController } from "../controller/concert.controller.js";

const router = Router();

router.use(internalAuthMiddleware);

router.get("/concerts/:concertId/ticket-types", ConcertController.getConcertTickets);
router.get("/concerts/:concertId/stocks", ConcertController.getConcertStock);
router.get("/concerts/:concertId", ConcertController.getConcertDetail);

export default router;
