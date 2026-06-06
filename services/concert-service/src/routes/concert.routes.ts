import { Router } from "express";
import {
  getConcertDetail,
  getConcertStock,
  getConcertTickets,
  getConcerts,
} from "../controller/concert.controller.js";

const router = Router();

router.get("/", getConcerts);
router.get("/:id", getConcertDetail);
router.get("/:id/tickets", getConcertTickets);
router.get("/:id/stock", getConcertStock);

export default router;
