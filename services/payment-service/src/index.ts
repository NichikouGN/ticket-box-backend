import express from "express";
import morgan from "morgan";
import paymentRoutes from "./routes/payment.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { createPaymentWorker } from "./workers/payment.worker.js";
import dotenv from "dotenv";
import { redis, waitForRedisReady } from "./clients/redis.client.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3004);

app.use(morgan("dev"));

app.use("/webhooks/stripe", express.raw({ type: "application/json" }), stripeRoutes);

app.use(express.json());

const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "payment-service",
      status: "running",
    },
  });
};

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/internal", paymentRoutes);

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Not Found" });
});

await waitForRedisReady(redis);

app.listen(PORT, async () => {
  console.log(`Payment Service listening on ${PORT}`);

  await createPaymentWorker();
});
