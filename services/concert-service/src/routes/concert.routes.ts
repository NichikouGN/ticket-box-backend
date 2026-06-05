import { Router } from "express";
import {
  getConcertDetail,
  getConcertStock,
  getConcertTickets,
  getConcerts,
} from "../controller/concert.controller.js";

const router = Router();

router.get("/concerts", getConcerts);
router.get("/concerts/:id", getConcertDetail);
router.get("/concerts/:id/tickets", getConcertTickets);
router.get("/concerts/:id/stock", getConcertStock);

export default router;
