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

export const activeSSEConnections = new Map<string, Response>();
const redisSubcriber = new Redis("redis://localhost:6379");

redisSubcriber.subscribe("order_updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to order_updates channel:", err);
  }
});

redisSubcriber.on("message", (channel, message) => {
  if (channel === "order_updates") {
    const { orderId, status, paymentUrl, paymentDeadline } = JSON.parse(message);
    const clientStream = activeSSEConnections.get(orderId);
    if (clientStream) {
      clientStream.write(`event: ORDER_UPDATED\n`);
      clientStream.write(`data: ${JSON.stringify({ orderId, status, paymentUrl, paymentDeadline })}\n\n`);
      clientStream.end();
    }
  }
});

app.listen(PORT, async () => {
  await createOrderWorker();
  console.log(`Order Service listening on ${PORT}`);
});
