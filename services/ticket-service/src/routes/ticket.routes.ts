import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TicketController } from "../controller/ticket.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", TicketController.getTickets);
router.get("/tickets/:ticketId", TicketController.getTicketById);
router.get("/concerts/:concertId", TicketController.getTicketsByConcertId);

export default router;
