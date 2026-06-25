import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TicketController } from "../controller/ticket.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/concerts/:concertId", TicketController.getTicketsByConcertId);
router.get("/:ticketId", TicketController.getTicketById);
router.get("/", TicketController.getTickets);

export default router;
