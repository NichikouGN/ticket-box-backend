import { Router } from "express";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";
import { internalController } from "../controller/internal.controller.js";

const router = Router();

router.use(internalAuthMiddleware);

router.post("/concerts/:concertId/ticket-types", internalController.getTicketTypesByIds);
router.get("/concerts/:concertId", internalController.getConcertDetails);

export default router;
