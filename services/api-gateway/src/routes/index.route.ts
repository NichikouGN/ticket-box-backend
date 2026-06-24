import { Router } from "express";
import { userProxy, authProxy, organizerProxy } from "../proxy/users.proxy.js";
import { concertProxy, organizerArtistProxy, organizerConcertProxy } from "../proxy/concert.proxy.js";
import { orderProxy } from "../proxy/orders.proxy.js";
// import { paymentProxy } from "../proxy/payment.proxy.js";
import { checkinProxy, ticketProxy } from "../proxy/tickets.proxy.js";

const router = Router();

router.use("/api/v1/users", userProxy);
router.use("/api/v1/organizer/users", organizerProxy);
router.use("/api/v1/auth", authProxy);

router.use("/api/v1/concerts", concertProxy);
router.use("/api/v1/organizer/concerts", organizerConcertProxy);
router.use("/api/v1/organizer/artists", organizerArtistProxy);

router.use("/api/v1/orders", orderProxy);
// router.use("/api/v1/payments", paymentProxy);

router.use("/api/v1/tickets", ticketProxy);
router.use("/api/v1/checkin", checkinProxy);

router.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
  });
});

export default router;
