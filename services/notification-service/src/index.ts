import express from "express";
import morgan from "morgan";
import { createNotificationWorker } from "./workers/notification.worker.js";
import notificationRoutes from "./routes/notification.route.js";
import type { Response } from "express";
import dotenv from "dotenv";
import { redis, waitForRedisReady } from "./clients/redis.client.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3006);

app.use(morgan("dev"));

app.use(express.json());

const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "notification-service",
      status: "running",
    },
  });
};

export const activeSSEConnections = new Map<string, Response>();

await waitForRedisReady(redis);
const redisSubcriber = redis.duplicate();

redisSubcriber.subscribe("notification_updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to notification_updates channel:", err);
  }
});

redisSubcriber.on("message", (channel, message) => {
  if (channel === "notification_updates") {
    const { userId, payload } = JSON.parse(message) as {
      userId: string;
      payload: {
        id: string;
        eventType: string;
        title: string;
        message: string;
        userStatus: string;
        createdAt: Date;
      };
    };
    const clientStream = activeSSEConnections.get(userId);
    if (clientStream) {
      clientStream.write(`event: NOTIFICATION_UPDATED\n`);
      clientStream.write(`data: ${JSON.stringify({ payload })}\n\n`);
      clientStream.end();
    }
  }
});

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/", notificationRoutes);

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Not Found" });
});

app.listen(PORT, async () => {
  console.log(`Notification Service listening on ${PORT}`);
  await createNotificationWorker();
});
