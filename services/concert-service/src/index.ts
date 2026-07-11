import express from "express";
import morgan from "morgan";
import concertRoutes from "./routes/concert.routes.js";
import organizerRoutes from "./routes/organizer.routes.js";
import internalRoutes from "./routes/internnal.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import { createConcertWorker } from "./workers/concert.worker.js";
import dotenv from "dotenv";
import { redis, waitForRedisReady } from "./clients/redis.client.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(morgan("dev"));
app.use(express.json());
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "concert-service",
      status: "running",
    },
  });
};

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/", concertRoutes);
app.use("/internal", internalRoutes);
app.use("/organizer", organizerRoutes);
app.use("/staff", staffRoutes);

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Not Found" });
});

await waitForRedisReady(redis);

app.listen(PORT, "0.0.0.0", async () => {
  await createConcertWorker();
  console.log(`Concert Service listening on ${PORT}`);
});
