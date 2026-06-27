import express from "express";
import morgan from "morgan";
import orderRoutes from "./routes/order.routes.js";
import { getRedisHealth } from "./clients/redis.client.js";
import { Redis } from "ioredis";
import type { Response } from "express";
import { createOrderWorker } from "./workers/order.worker.js";

const app = express();
const PORT = Number(process.env.PORT || 3004);

app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "order-service",
      status: "running",
      redis: getRedisHealth(),
    },
  });
});

app.use("/", orderRoutes);

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Not Found" });
});

export const paymentUrlConnections = new Map<string, Response>();
export const orderConfirmConnections = new Map<string, Response>();

const paymentSubscriber = new Redis("redis://localhost:6379");
const orderConfirmSubscriber = new Redis("redis://localhost:6379");

paymentSubscriber.subscribe("payment_url_updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to payment_url_updates channel:", err);
  }
});

paymentSubscriber.on("message", (channel, message) => {
  if (channel === "payment_url_updates") {
    const { orderId, status, paymentUrl, paymentDeadline } = JSON.parse(message);
    const clientStream = paymentUrlConnections.get(orderId);
    if (clientStream) {
      clientStream.write(`event: ORDER_UPDATED\n`);
      clientStream.write(`data: ${JSON.stringify({ orderId, status, paymentUrl, paymentDeadline })}\n\n`);
      clientStream.end();
    }
  }
});

orderConfirmSubscriber.subscribe("order_confirm_updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to order_confirm_updates channel:", err);
  }
});

orderConfirmSubscriber.on("message", (channel, message) => {
  if (channel === "order_confirm_updates") {
    const { orderId, status } = JSON.parse(message);
    const clientStream = orderConfirmConnections.get(orderId);
    if (clientStream) {
      clientStream.write(`event: ORDER_UPDATED\n`);
      clientStream.write(`data: ${JSON.stringify({ orderId, status })}\n\n`);
      clientStream.end();
    }
  }
});

app.listen(PORT, async () => {
  await createOrderWorker();
  console.log(`Order Service listening on ${PORT}`);
});
