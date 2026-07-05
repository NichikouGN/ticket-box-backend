import express from "express";
import { createPaymentWorker } from "./workers/ticket.worker.js";
import ticketRoutes from "./routes/ticket.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import dotenv from "dotenv";
import morgan from "morgan";
import { redis, waitForRedisReady } from "./clients/redis.client.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3005);

app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  console.log("original url: ", req.originalUrl);
});

app.use("/tickets", ticketRoutes);
app.use("/checkin", checkinRoutes);

await waitForRedisReady(redis);

app.listen(PORT, async () => {
  await createPaymentWorker();
  console.log(`Ticket Service listening on ${PORT}`);
});
