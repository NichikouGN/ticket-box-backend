import { Router } from "express";
import { userProxy, authProxy, organizerProxy } from "../proxy/users.proxy.js";
import { concertProxy, organizerArtistProxy, organizerConcertProxy, staffVipProxy } from "../proxy/concert.proxy.js";
import { orderProxy } from "../proxy/orders.proxy.js";
import { checkinProxy, ticketProxy } from "../proxy/tickets.proxy.js";
import { notificationProxy } from "../proxy/notifications.proxy.js";
import createTokenBucket from "../middleware/rate_limit.middleware.js";
import type { Request } from "express";

const router = Router();

const authLimiter = createTokenBucket({
  capacity: 5,
  refillRate: 0.1,
  prefix: "auth",
  getKey: (req: Request) => req.ip,
});

const userLimiter = createTokenBucket({
  capacity: 40,
  refillRate: 2,
  prefix: "user",
  getKey: (req: Request) => req.ip,
});

const concertLimiter = createTokenBucket({
  capacity: 40,
  refillRate: 2,
  prefix: "concert",
  getKey: (req: Request) => req.ip,
});

const orderLimiter = createTokenBucket({
  capacity: 10,
  refillRate: 2,
  prefix: "order",
  getKey: (req: Request) => req.ip,
});

const ticketLimiter = createTokenBucket({
  capacity: 200,
  refillRate: 25,
  prefix: "ticket",
  getKey: (req: Request) => req.ip,
});

const organizerLimiter = createTokenBucket({
  capacity: 120,
  refillRate: 12,
  prefix: "organizer",
  getKey: (req: Request) => req.ip,
});

const notificationLimiter = createTokenBucket({
  capacity: 60,
  refillRate: 5,
  prefix: "notification",
  getKey: (req: Request) => req.ip,
});

router.use("/api/v1/users", userLimiter, userProxy);
router.use("/api/v1/organizer/users", organizerLimiter, organizerProxy);
router.use("/api/v1/auth", authLimiter, authProxy);

router.use("/api/v1/concerts", concertLimiter, concertProxy);
router.use("/api/v1/organizer/concerts", organizerLimiter, organizerConcertProxy);
router.use("/api/v1/organizer/artists", organizerLimiter, organizerArtistProxy);

router.use("/api/v1/staff/concerts", ticketLimiter, staffVipProxy);

router.use("/api/v1/orders", orderLimiter, orderProxy);

router.use("/api/v1/tickets", ticketLimiter, ticketProxy);
router.use("/api/v1/checkin", ticketLimiter, checkinProxy);

router.use("/api/v1/notifications", notificationLimiter, notificationProxy);

router.get("/", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
  });
});

export default router;
