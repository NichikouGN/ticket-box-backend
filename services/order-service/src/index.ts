import express from "express";
import morgan from "morgan";
import orderRoutes from "./routes/order.routes.js";
import { startOrderCleanupWorker } from "./workers/order.worker.js";
import { getRedisHealth } from "./infrastructure/redis.client.js";

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

app.listen(PORT, () => {
  startOrderCleanupWorker();
  console.log(`Order Service listening on ${PORT}`);
});
