import { Router } from "express";
import concertRoutes from "./concert.routes.js";
import organizerRoutes from "./organizer.routes.js";
import { getHealth } from "../controller/concert.controller.js";

const router = Router();

router.get("/health", getHealth);
router.use(concertRoutes);
router.use("/organizer", organizerRoutes);

export default router;
